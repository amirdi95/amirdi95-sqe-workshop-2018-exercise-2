import assert from 'assert';
import {parseCode , SS} from '../src/js/code-analyzer';
import * as escodegen from 'escodegen';



describe('without params without body',() => {
    it('empty function', () => {
        assert(escodegen.generate(SS(parseCode('function foo(){}')).code) === 'function foo() {\n' +
            '}');
    });
    it('1 let', () => {
        assert(escodegen.generate(SS(parseCode('function foo(){let a =1;}')).code) === 'function foo() {\n' +
            '}');
    });
    it('2 let', () => {
        assert(escodegen.generate(SS(parseCode('function foo(){let a =1; let b=2;}')).code) === 'function foo() {\n' +
            '}');
    });
    it('let wuthout init', () => {
        assert(escodegen.generate(SS(parseCode('function f(){\n' + 'let a;\n' + 'a = 3;\n' +'}')).code)
            === 'function f() {\n' + '}');
    });
});

describe('with params without body',() => {
    it('1 param', () => {
        assert(escodegen.generate(SS(parseCode('1\n' +
            'function foo(x){}')).code) === 'function foo(x) {\n' + '}');
    });
    it('2 params', () => {
        assert(escodegen.generate(SS(parseCode('1,2\n' +'function foo(x,y){}\n')).code) === 'function foo(x, y) {\n' +'}');
    });
    it('3 params', () => {
        assert(escodegen.generate(SS(parseCode('function foo(){}')).code) === 'function foo() {\n' +
            '}');
    });

});

describe('with params with body',() => {
    it('2 param & empty if', () => {
        assert(escodegen.generate(SS(parseCode('1,2\n' + 'function foo(x,y){let a = 5; if(a<x){}}')).code) === 'function foo(x, y) {\n' +
            '    if (5 < x) {\n' +
            '    }\n'
            +'}');
    });
    it('2 param & if', () => {
        assert(escodegen.generate(SS(parseCode('1,2\n' +'function foo(x,y){let a = 5; if(a<x){a = 6;}}\n')).code) === 'function foo(x, y) {\n' +
            '    if (5 < x) {\n' +
            '    }\n' +
            '}');
    });

});

describe('with return & if',() => {
    it('if & return', () => {
        assert(escodegen.generate(SS(parseCode('1,2\n' +
            'function foo(x,y)\n' + '{let a = 5;\n' +
            ' if(a<x){\n' + 'a = 6;}\n' +
            'return a ;\n' +'}')).code) === 'function foo(x, y) {\n' +
            '    if (5 < x) {\n' + '    }\n' + '    return 5;\n' +
            '}');
    });

    it('if & else & return', () => {
        assert(escodegen.generate(SS(parseCode('1,2\n' +'function foo(x,y)\n' +
            '{let a = 5;\n' + ' if(a<x){\n' +
            'a = 6;}\n' +'else{a=7;}\n' +
            'return a ;\n' +'}')).code) === 'function foo(x, y) {\n' + '    if (5 < x) {\n' +
            '    } else {\n' + '    }\n' + '    return 5;\n' +
            '}');
    });
});

describe('with while',() => {
    it('2 param & while', () => {
        assert(escodegen.generate(SS(parseCode('1,2\n' + 'function foo(x,y){\n' +'let a = 5;\n' +'while(a>6){\n' +
            '}\n' + '}')).code) === 'function foo(x, y) {\n' +'    while (5 > 6) {\n' + '    }\n' + '}');
    });
    it('while + let in while', () => {
        assert(escodegen.generate(SS(parseCode('1,2\n' + 'function foo(x,y){\n' + 'let a = 5;\n' + 'while(a>6){\n' +
            'let c =6;}\n' + '}')).code) === 'function foo(x, y) {\n' + '    while (5 > 6) {\n' + '    }\n' + '}');
    });
});

describe('with global variables',() => {
    it('1 global', () => {
        assert(escodegen.generate(SS(parseCode('1,2\n' + 'let d = 4;\n' + 'function foo(x,y){\n' + 'let a = 5;\n' +
            'while(a>d){\n' + 'let c =6;}\n' + '}')).code) === 'function foo(x, y) {\n' + '    while (5 > 4) {\n' + '    }\n' +
            '}');
    });
    it('1 global + AssignmentExpression of param', () => {
        assert(escodegen.generate(SS(parseCode('1,2\n' +'let d = 4;\n' +'function foo(x,y){\n' +
            'let a = 5;\n' + 'while(a>d){\n' +'x = x +1;}\n' + '}')).code) === 'function foo(x, y) {\n' +
            '    while (5 > 4) {\n' + '        x = x + 1;\n' +'    }\n' + '}');
    });
});


