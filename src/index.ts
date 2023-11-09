import { $$raw, EmptyDecorator, RawContext } from 'ts-macros';
import ts from 'typescript';
/*
function $add(numA: number, numB: number) : EmptyDecorator {
    return (numA + numB) as unknown as EmptyDecorator;
}

@$add!(1,2)
class Test {}
*/

/*
function $map<T,R>(arr: Array<T>, cb: (el: T) => R) : Array<R> {
    const array = arr;
    const res = [];
    for (let i = 0; i < array.length; i++) {
        res.push(cb(array[i]));
    }
    return res;
}

$map!([1,2,3], (num) => num * 2);
*/

function $renameClass(newName: string) : EmptyDecorator {
    return $$raw!((ctx, newNameNode: ts.StringLiteral) => {
       const target = ctx.thisMacro.target as ts.ClassDeclaration;
       return ctx.factory.createClassDeclaration(
            target.modifiers?.filter(m => m.kind !== ctx.ts.SyntaxKind.Decorator),
            ctx.factory.createIdentifier(newNameNode.text),
            target.typeParameters,
            target.heritageClauses,
            target.members
        )
    });
}

function $addDebugMethod() : EmptyDecorator {
    return $$raw!((ctx) => {
        const target = ctx.thisMacro.target as ts.ClassDeclaration;
        return ctx.factory.createClassDeclaration(
            target.modifiers?.filter(m => m.kind !== ctx.ts.SyntaxKind.Decorator),
            target.name,
            target.typeParameters,
            target.heritageClauses,
            [
                ...target.members,
                ctx.factory.createMethodDeclaration(
                    undefined,
                    undefined,
                    "debug",
                    undefined,
                    undefined,
                    [],
                    undefined,
                    ctx.factory.createBlock(ctx.transformer.strToAST(`
                        console.log(
                            "${target.name?.getText()} ", "{\\n",
                                ${target.members.filter(m => ctx.ts.isPropertyDeclaration(m) && ctx.ts.isIdentifier(m.name)).map(m => `"${(m.name as ts.Identifier).text}: ", this.${(m.name as ts.Identifier).text}}`).join(",\"\\n\",")},
                            "\\n}"
                        )
                    `))
                )
            ]
        )
    });
}

function copyMethod(ctx: RawContext, original: ts.MethodDeclaration, name?: string, body?: ts.Block): ts.MethodDeclaration {
    return ctx.factory.createMethodDeclaration(
        original.modifiers?.filter(m => m.kind !== ctx.ts.SyntaxKind.Decorator),
        original.asteriskToken,
        name ? ctx.factory.createIdentifier(name) : original.name,
        original.questionToken,
        original.typeParameters,
        original.parameters,
        original.type,
        body || original.body
    )
}

function $renameMethod(newName: string) : EmptyDecorator {
    return $$raw!((ctx, newNameNode: ts.StringLiteral) => {
        const target = ctx.thisMacro.target as ts.MethodDeclaration;
        return [
            copyMethod(ctx, target),
            copyMethod(ctx, target, newNameNode.text)
        ];
    })
}

@$renameClass!("NewTest")
@$addDebugMethod!()
class Test {
    propA: number
    propB: string
    constructor(a: number, b: string) {
        this.propA = a;
        this.propB = b;
    }

    @$renameMethod!("add_3")
    @$renameMethod!("add_2")
    @$renameMethod!("add_1")
    add(a: number, b: string) {
        return a+b;
    }
}