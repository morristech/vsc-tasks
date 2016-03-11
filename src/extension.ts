'use strict';
import * as vscode from 'vscode';
import {EOL} from 'os';

export function activate(context: vscode.ExtensionContext) {
    let task = new Task();
    
    let addTask = vscode.commands.registerCommand('extension.addTask', () => {
       task.add(true); 
    });
    
    let addTaskAbove = vscode.commands.registerCommand('extension.addTaskAbove', () => {
        task.add(false);
    });
    
    let completeTask = vscode.commands.registerCommand('extension.completeTask', () => {
        task.complete();
    });
    
    let cancelTask = vscode.commands.registerCommand('extension.cancelTask', () => {
        task.cancel();
    });
    
    context.subscriptions.push(task);
    context.subscriptions.push(addTask);
    context.subscriptions.push(addTaskAbove);
    context.subscriptions.push(completeTask);
    context.subscriptions.push(cancelTask);
}

class Task {
    
    private config = {
        baseMarker: '☐',
        cancelMarker: '✘',
        completeMarker: '✔'
    };    
    
    public add(stage: boolean): any {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        
        //get current position
        let currentLine = editor.selection.active.line; //starts with 0
        
        //get info
        let info = this.getLineinfo(editor, currentLine, this.config.baseMarker);
        
        //insert line below or above
        stage ? insertLineBelow() : insertLineAbove()
        
        //insert marker text
        
        //intend marker text
        function insertLineBelow(): any {
            editor.edit( editBuilder => {
                editBuilder.insert(info.lineEnd, '\n');
            })
        }
        
        function insertLineAbove(): any {
            editor.edit( editBuilder => {
                editBuilder.insert(info.lineStart, '\n');
            })
        }
    }
    
    public complete(): any {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        
        //get current position
        
        //get info
        
        //baseMarker ? replace baseMarker with CompleteMarker : replace CompleteMarker with baseMarker
        
        //append "done" Message
    }
    
    public cancel(): any {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        
        //get current position
        
        //get info
        
        //replace baseMarker || CompleteMarker with cancelMarker
        
        //append "cancel" Message
    }
    
    private getLineinfo(editor, lineNumber: number, marker: string): Object {
        let line = editor.document.lineAt(lineNumber).text;
        let firstNWSC = editor.document.lineAt(lineNumber).firstNonWhitespaceCharacterIndex;
        let lineStart = editor.document.lineAt(lineNumber).range.start;
        let lineEnd = editor.document.lineAt(lineNumber).range.end;
        let result = {
            lineNumber: lineNumber,
            line: line,
            lineStart: lineStart,
            lineEnd: lineEnd,
            firstNWSC: firstNWSC
        };
        return result;
    }
    
    dispose(): any {}
}

export function deactivate() {
}