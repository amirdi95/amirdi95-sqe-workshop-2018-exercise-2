import * as esprima from 'esprima';
import * as estraverse from 'estraverse';
import * as escodegen from 'escodegen';

export {parseCode ,SS , removeEndLine , colorTable};

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse , {loc : true});
};

function parseArguments(args){
    let ret ;
    if (args.expression.type === 'SequenceExpression')
        ret = args.expression.expressions.map(e => eval(escodegen.generate(e)));
    else {
        ret = [eval(escodegen.generate(args.expression))];
    }
    return ret;
}

let main_handler = {
    'VariableDeclaration':SSVariableDeclaration,
    'WhileStatement' :SSWhileStatement,
    'ReturnStatement':SSReturnStatement,
    'IfStatement':SSIfStatement,
    'ExpressionStatement':SSExpressionStatement,
    'AssignmentExpression':SSAssignmentExpression};

let paramsTable;
let colorTable = [];

function SS(parsedCode) {
    colorTable = [];
    paramsTable = [];
    let variablesTable = [];
    let args;
    for(let i = 0 ; i<parsedCode.body.length ; i++) {
        if(parsedCode.body[i].type === 'ExpressionStatement'){
            args = parseArguments(parsedCode.body[i]);
        }
        if (parsedCode.body[i].type === 'VariableDeclaration') {
            variablesTable = SSVariableDeclaration(parsedCode.body[i],paramsTable , variablesTable);
        }
        if (parsedCode.body[i].type === 'FunctionDeclaration') {
            return caseFunctionDeclaration(parsedCode.body[i] ,parsedCode , paramsTable,variablesTable ,args);
        }
    }
}

function caseFunctionDeclaration(body , parsedCode , paramsTable , variablesTable,args) {
    for (let j = 0; j < body.params.length; j++)
        paramsTable.push({name :escodegen.generate(body.params[j]) , value :args[j]});
    substitute(body, paramsTable, variablesTable);
    parsedCode = parseCode(escodegen.generate(body));
    return {code : parsedCode , params : paramsTable} ;
}

function startHandler(node ,paramsTable ,variablesTable){
    return main_handler[node.type]? (main_handler[node.type](node, paramsTable, variablesTable)) : variablesTable;
}

function substitute(code, paramsTable, variablesTable) {
    estraverse.replace(code, {
        enter: function (node) {
            variablesTable = startHandler(node ,paramsTable, variablesTable);
            let varsName;
            switch (node.type) {
            case 'VariableDeclaration' :
                this.remove();
                break;
            case 'ExpressionStatement' :
                varsName = node.expression.left;
                if (node.expression.type === 'AssignmentExpression' && !checkIfParam(paramsTable , escodegen.generate(varsName)))
                    this.remove();
            }
        }
    });
    return variablesTable;
}

function checkIfParam(paramsTable , varName){
    for(let i = 0 ; i<paramsTable.length ; i++){
        if(paramsTable[i].name ===varName )
            return true;
    }
    return false;
}

function SSVariableDeclaration(node,paramsTable,variablesTable) {
    let b = node.declarations ,id , init;
    for(let i = 0 ; i<b.length ; i++){
        id = b[i].id.name;
        if(b[i].init !== null){
            init = removeEndLine(escodegen.generate(changeVar(b[i].init , paramsTable , variablesTable)));}
        else{init = null;}
        variablesTable.push({name : id , value : init});
    }
    return variablesTable;
}

function changeVar(init , paramsTable , variablesTable) {
    return estraverse.replace(init, {
        enter: function (node) {
            if(node.type === 'Identifier' && !paramsTable.includes(escodegen.generate(node))){
                return IfExistsReturn(node ,paramsTable,variablesTable);
            }
        }
    });
}

function SSWhileStatement(node , paramsTable , variablesTable) {
    let newVariablesTable = JSON.parse(JSON.stringify(variablesTable));
    let test =  removeEndLine(escodegen.generate(changeVar(node.test, paramsTable, variablesTable)));
    node.test = parseCode(test).body[0].expression;
    substitute(node.body , paramsTable , newVariablesTable);
    return variablesTable;
}

function SSIfStatement(node , paramsTable , variablesTable){
    let newVariablesTable1 = JSON.parse(JSON.stringify(variablesTable));
    let newVariablesTable2 = JSON.parse(JSON.stringify(variablesTable));
    let newParamsTable1 = JSON.parse(JSON.stringify(paramsTable));
    let newParamsTable2 = JSON.parse(JSON.stringify(paramsTable));

    node.test = parseCode(removeEndLine(escodegen.generate(changeVar(node.test, paramsTable, variablesTable)))).body[0].expression;
    if(node.alternate != null) {
        substitute(node.alternate, newParamsTable1, newVariablesTable1);
    }
    substitute(node.consequent , newParamsTable2 , newVariablesTable2);
    return variablesTable;
}

function SSReturnStatement(node,paramsTable,variablesTable) {
    node.argument = parseCode(removeEndLine(escodegen.generate(changeVar(node.argument , paramsTable , variablesTable)))).body[0].expression;
    return variablesTable;
}

function SSExpressionStatement(node , paramsTable ,variablesTable ) {
    return (main_handler[node.expression.type](node.expression, paramsTable, variablesTable));
}

function SSAssignmentExpression(node , paramsTable ,variablesTable) {
    let right = removeEndLine(escodegen.generate(changeVar(node.right , paramsTable , variablesTable)));
    node.right = parseCode(right).body[0].expression;
    for(let i =0 ; i<variablesTable.length ; i++){
        if(variablesTable[i].name === node.left.name) {
            variablesTable[i].value = right;
        }
    }
    for(let i =0 ; i<paramsTable.length ; i++){
        if(paramsTable[i].name === node.left.name) {
            paramsTable[i].value = right;
        }
    }
    return variablesTable;
}

function IfExistsReturn(node ,paramsTable, variablesTable) {
    for (let i = 0; i < variablesTable.length; i++) {
        if (variablesTable[i].name === escodegen.generate(node)) {
            let pc = parseCode(variablesTable[i].value);
            return pc.body[0];
        }
    }
}

function removeEndLine(line) {
    return line.replace(/;/g , '');
}





