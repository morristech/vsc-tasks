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
  
  let convertTask = vscode.commands.registerCommand('extension.convertTask', () => {
    task.convert();
  });
  
  context.subscriptions.push(task);
  context.subscriptions.push(addTask);
  context.subscriptions.push(addTaskAbove);
  context.subscriptions.push(completeTask);
  context.subscriptions.push(cancelTask);
  context.subscriptions.push(convertTask);
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
    let editor: any = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    
    let config: any = this.config;
    
    //get current position
    let currentLine: number = editor.selection.active.line;
    
    //get info
    let info: any = this.getLineinfo(editor, currentLine, config.baseMarker);
    
    //insert line below or above
    stage ? insertLineBelow() : insertLineAbove()
    
    //helper-functions
    function insertLineBelow(): any {
      editor.edit( editBuilder => {
        editBuilder.insert(info.lineEnd, '\n\t' + info.marker + ' ');
      })
    }
    
    function insertLineAbove(): any {
      editor.edit( editBuilder => {
        editBuilder.insert(info.prevLine, '\n\t' + info.marker + ' ');
      });
      editor.selection = new vscode.Selection(info.lineEnd, info.lineEnd);
    }
  }
  
  public complete(): any {
    let editor: any = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    
    let config: any = this.config;
    let replaceLine: any = this.replaceLine;
    let appendMessage: any = this.appendMessage;
    
    //get current position
    let currentLine: number = editor.selection.active.line;
    
    //get info
    let info:any = this.getLineinfo(editor, currentLine, config.completeMarker);
    
    if (info.containsBase !== -1) {
      //baseMarker => completeMarker
      replaceLine(editor, info, config.baseMarker, info.marker, '');
      appendMessage(editor, info, config.doneMessage);
    } else if (info.containsComplete !== -1) {
      //completeMarker => baseMarker
      replaceLine(editor, info, info.marker, config.baseMarker, config.doneMessage)
    } else if (info.containsCancel !== -1) {
      //cancelMarker => completeMarker 
      replaceLine(editor, info, config.cancelMarker, info.marker, config.cancelMessage);
      appendMessage(editor, info, config.doneMessage);
    }
  }
  
  public cancel(): any {
    let editor: any = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    
    let config: any = this.config;
    let replaceLine: any = this.replaceLine;
    let appendMessage: any = this.appendMessage;
    
    //get current position
    let currentLine: number = editor.selection.active.line;
    
    //get info
    let info: any = this.getLineinfo(editor, currentLine, config.cancelMarker);
    
    if (info.containsBase !== -1) {
      //baseMarker => cancelMarker
      replaceLine(editor, info, config.baseMarker, info.marker, '');
      appendMessage(editor, info, config.cancelMessage);
    } else if (info.containsComplete !== -1) {
      //completeMarker => cancelMarker
      replaceLine(editor, info, config.completeMarker, info.marker, config.doneMessage);
      appendMessage(editor, info, config.cancelMessage);
    } else if (info.containsCancel !== -1) {
      //cancelMarker => baseMarker
      replaceLine(editor, info, info.marker, config.baseMarker, config.cancelMessage);
    }
  }
  
  public convert(): any {
    let editor: any = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    
    let config: any = this.config;
    
    //get current position
    let currentLine: number = editor.selection.active.line;
    
    //get info
    let info: any = this.getLineinfo(editor, currentLine, config.baseMarker);
    
    if (info.containsBase === -1 && info.containsComplete === -1 && info.containsCancel === -1) {
      editor.edit( editBuilder => {
        editBuilder.insert(info.firstNonWhitePos, info.marker + ' ');
      })
    }
  }
  
  private getLineinfo(editor, lineNumber: number, marker: string): Object {
    let config: any = this.config;
    let lineText: string = editor.document.lineAt(lineNumber).text;
    let lineRange: vscode.Range = editor.document.lineAt(lineNumber).range;
    let lineEnd: vscode.Position = editor.document.lineAt(lineNumber).range.end;
    let firstNonWhiteChar: number = editor.document.lineAt(lineNumber).firstNonWhitespaceCharacterIndex;
    let firstNonWhitePos: vscode.Position = new vscode.Position(lineNumber, firstNonWhiteChar);
    let prevLine: vscode.Position;
    if (lineNumber === 0) {
      prevLine = new vscode.Position(0, lineText.length);
    } else {
      prevLine = new vscode.Position(lineNumber -1, lineText.length);
    }
    let containsBase: number = lineText.indexOf(config.baseMarker) 
    let containsComplete: number = lineText.indexOf(config.completeMarker);
    let containsCancel: number = lineText.indexOf(config.cancelMarker);
    let result = {
      lineNumber: lineNumber,
      lineText: lineText,
      lineRange: lineRange,
      lineEnd: lineEnd,
      prevLine: prevLine,
      firstNonWhitePos: firstNonWhitePos,
      containsBase: containsBase,
      containsComplete: containsComplete,
      containsCancel: containsCancel,
      marker: marker
    };
    return result;
  }
  
  private replaceLine(editor: any, info: any, markerFrom: string, markerTo: string, messageFrom: string): any {
    let newLine: string;
    if (messageFrom !== '') {
      newLine = info.lineText.replace(markerFrom, markerTo).replace(messageFrom, '');
    } else {
      newLine = info.lineText.replace(markerFrom, markerTo);
    }
    editor.edit (editBuilder => {
      editBuilder.replace(info.lineRange, newLine);
    })  
  }
  
  private appendMessage(editor: any, info: any, message: string): any {
    editor.edit (editBuilder => {
      editBuilder.insert(info.lineEnd, message);
    })
  }
  dispose(): any {}
}

export function deactivate() {}