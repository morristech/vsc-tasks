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
    completeMarker: '✔',
    doneMessage: ' @done',
    cancelMessage: ' @canceled'
  };  
  
  public add(stage: boolean): any {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    
    let config = this.config;
    
    //get current position
    let currentLine = editor.selection.active.line; //starts with 0
    
    //get info
    let info: any = this.getLineinfo(editor, currentLine, config.baseMarker);
    
    //insert line below or above
    stage ? insertLineBelow() : insertLineAbove()
    
    //helper-functions
    function insertLineBelow(): any {
      editor.edit( editBuilder => {
        editBuilder.insert(info.lineEnd, '\n\t'+info.marker+' ');
      })
    }
    
    function insertLineAbove(): any {
      editor.edit( editBuilder => {
        editBuilder.insert(info.lineStart, '\n\t'+info.marker+' ');
      })
    }
  }
  
  public complete(): any {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    
    let config = this.config;
    let replaceLine = this.replaceLine;
    
    //get current position
    let currentLine = editor.selection.active.line; //starts with 0
    
    //get info
    let info:any = this.getLineinfo(editor, currentLine, config.completeMarker);
    
    if (info.containsBase !== -1) {
      //baseMarker => completeMarker
      replaceLine(editor, info, config.baseMarker, info.marker, config.doneMessage, 'append');
    } else if (info.containsComplete !== -1) {
      //completeMarker => baseMarker
      replaceLine(editor, info, info.marker, config.baseMarker, config.doneMessage, '')
    } else if (info.containsCancel !== -1) {
      //cancelMarker => completeMarker 
      replaceLine(editor, info, config.cancelMarker, info.marker, config.cancelMessage, config.doneMessage);
    }
  }
  
  public cancel(): any {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    
    let config = this.config;
    let replaceLine = this.replaceLine;
    
    //get current position
    let currentLine = editor.selection.active.line; //starts with 0
    
    //get info
    let info: any = this.getLineinfo(editor, currentLine, config.cancelMarker);
    
    if (info.containsBase !== -1) {
      //baseMarker => cancelMarker
      replaceLine(editor, info, config.baseMarker, info.marker, config.cancelMessage, 'append');
    } else if (info.containsComplete !== -1) {
      //completeMarker => cancelMarker
      replaceLine(editor, info, config.completeMarker, info.marker, config.doneMessage, config.cancelMessage);
    } else if (info.containsCancel !== -1) {
      //cancelMarker => baseMarker
      replaceLine(editor, info, info.marker, config.baseMarker, config.cancelMessage, '');
    }
  }
  
  private getLineinfo(editor, lineNumber: number, marker: string): Object {
    let config = this.config;
    let lineText = editor.document.lineAt(lineNumber).text;
    let lineRange = editor.document.lineAt(lineNumber).range;
    let lineStart = editor.document.lineAt(lineNumber).range.start;
    let lineEnd = editor.document.lineAt(lineNumber).range.end;
    let containsBase = lineText.indexOf(config.baseMarker) 
    let containsComplete = lineText.indexOf(config.completeMarker);
    let containsCancel = lineText.indexOf(config.cancelMarker);
    let result = {
      lineNumber: lineNumber,
      lineText: lineText,
      lineRange: lineRange,
      lineStart: lineStart,
      lineEnd: lineEnd,
      containsBase: containsBase,
      containsComplete: containsComplete,
      containsCancel: containsCancel,
      marker: marker
    };
    return result;
  }
  
  private replaceLine(editor: any, info: any, markerFrom: string, markerTo: string, messageFrom: string, messageTo: string) {
    let newLine;
    if (messageTo === 'append') {
      newLine = info.lineText.replace(markerFrom, markerTo) + messageFrom;
    } else {
      newLine = info.lineText.replace(markerFrom, markerTo).replace(messageFrom, messageTo);
    }
    editor.edit ( editBuilder => {
      editBuilder.replace(info.lineRange, newLine);
    })  
  }
  
  dispose(): any {}
}

export function deactivate() {}