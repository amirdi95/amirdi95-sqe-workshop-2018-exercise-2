import $ from 'jquery';
import {parseCode} from './code-analyzer';
import {SS ,  colorTable ,removeEndLine} from './code-analyzer';
import * as escodegen from 'escodegen';
import * as estraverse from 'estraverse';


$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        let codeAfterSS = SS(parsedCode);
        let params = codeAfterSS.params;
        let s = escodegen.generate(codeAfterSS.code);
        evaluate(parseCode(s) , params);
        document.getElementById('ss').innerHTML = '';
        color(s,colorTable);
    });

});
function evaluate(code , params) {
    estraverse.replace(code, {
        enter: function (node) {
            switch (node.type) {
            case 'Identifier' :
                return returnValueObject(node, params);
            case 'IfStatement':
                evaluate(node.test , params);
                if(eval(removeEndLine(escodegen.generate(node.test)))){
                    colorTable.push({line : node.test.loc.start.line , color : 'g'});
                }
                else{
                    colorTable.push({line : node.test.loc.start.line , color : 'r'});
                }
            }
        }
    });
}

function returnValueObject(node , params) {
    for (let i = 0; i < params.length; i++) {
        if (params[i].name === escodegen.generate(node)) {
            let pc = parseCode(JSON.stringify(params[i].value));
            return pc.body[0];
        }
    }
    return node;
}

function color(s , colorTable){
    let perLine = s.split('\n');
    let code = document.getElementsByTagName('body')[0];
    for(let i = 0 ; i<perLine.length ; i++){
        let element = document.createElement('i');
        code.appendChild(element);
        element.appendChild(document.createTextNode(perLine[i]));
        element.appendChild(document.createElement('br'));
        switch (getColor(i , colorTable)) {
        case 'g':
            element.style.background = '#7fff17';
            break;
        case 'r':
            element.style.background = '#ff150c';
            break;
        case 'w':
            element.style.background = 'white';
        }
    }
}

function getColor(line , colorTable){
    for(let i =0 ; i< colorTable.length ; i++){
        if(colorTable[i].line === line+1) {
            return colorTable[i].color;
        }
    }
    return 'w';

}
