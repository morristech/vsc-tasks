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
        let info: any = this.getLineinfo(editor, currentLine, this.config.baseMarker);
        
        //insert line below or above
        stage ? insertLineBelow() : insertLineAbove()
        
        //helper-functions
        function insertLineBelow(): any {
            editor.edit( editBuilder => {
                editBuilder.insert(info.lineEnd, EOL+'\t'+info.marker+' ');
            })
        }
        
        function insertLineAbove(): any {
            editor.edit( editBuilder => {
                editBuilder.insert(info.lineStart, EOL+'\t'+info.marker+' ');
            })
        }
    }
    
    public complete(): any {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        
        //get current position
        let currentLine = editor.selection.active.line; //starts with 0
        
        //get info
        let info:any = this.getLineinfo(editor, currentLine, this.config.completeMarker);
        
        //baseMarker ? replace baseMarker with CompleteMarker : replace CompleteMarker with baseMarker
        let contains = info.lineText.indexOf(this.config.baseMarker);
        let containsBase = info.lineText.indexOf(this.config.baseMarker) 
        let containsComplete = info.lineText.indexOf(this.config.completeMarker);
        let containsCancel = info.lineText.indexOf(this.config.cancelMarker);
        if (containsBase !== -1) {
            let newLine = info.lineText.replace(this.config.baseMarker, info.marker);        
            editor.edit ( editBuilder => {
                editBuilder.replace(info.lineRange, newLine);
            })
        } else if (containsComplete !== -1) {
            let newLine = info.lineText.replace(this.config.completeMarker, this.config.baseMarker);        
            editor.edit ( editBuilder => {
                editBuilder.replace(info.lineRange, newLine);
            })
        } else if (containsCancel !== -1) {
            vscode.window.showErrorMessage('You already canceled this Task. Uncancel it to keep going... ');
        }
        
        //append "done" Message
    }
    
    public cancel(): any {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        
        //get current position
        let currentLine = editor.selection.active.line; //starts with 0
        
        //get info
        let info: any = this.getLineinfo(editor, currentLine, this.config.cancelMarker);
        
        //baseMarker || completeMarker ? replace with cancelMarker
        let containsBase = info.lineText.indexOf(this.config.baseMarker) 
        let containsComplete = info.lineText.indexOf(this.config.completeMarker);
        let containsCancel = info.lineText.indexOf(this.config.cancelMarker);
        if (containsBase !== -1) {
            let newLine = info.lineText.replace(this.config.baseMarker, info.marker);        
            editor.edit ( editBuilder => {
                editBuilder.replace(info.lineRange, newLine);
            })
        } else if (containsComplete !== -1) {
            let newLine = info.lineText.replace(this.config.completeMarker, info.marker);        
            editor.edit ( editBuilder => {
                editBuilder.replace(info.lineRange, newLine);
            })
        } else if (containsCancel !== -1) {
            let newLine = info.lineText.replace(this.config.cancelMarker, this.config.baseMarker);        
            editor.edit ( editBuilder => {
                editBuilder.replace(info.lineRange, newLine);
            })
        }
        
        //append "cancel" Message
    }
    
    private getLineinfo(editor, lineNumber: number, marker: string): Object {
        let lineText = editor.document.lineAt(lineNumber).text;
        let lineRange = editor.document.lineAt(lineNumber).range;
        let lineStart = editor.document.lineAt(lineNumber).range.start;
        let lineEnd = editor.document.lineAt(lineNumber).range.end;
        let result = {
            lineNumber: lineNumber,
            lineText: lineText,
            lineRange: lineRange,
            lineStart: lineStart,
            lineEnd: lineEnd,
            marker: marker
        };
        return result;
    }
    
    dispose(): any {}
}

export function deactivate() {}