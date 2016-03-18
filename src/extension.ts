'use strict';
import * as vscode from 'vscode';
import * as moment from 'moment';

export function activate(context: vscode.ExtensionContext) {
  let task = new Task();
  
  let addTask = vscode.commands.registerCommand('tasks.addTask', () => {
     task.add(true);
  });
  
  let addTaskAbove = vscode.commands.registerCommand('tasks.addTaskAbove', () => {
    task.add(false);
  });
  
  let completeTask = vscode.commands.registerCommand('tasks.completeTask', () => {
    task.complete();
  });
  
  let cancelTask = vscode.commands.registerCommand('tasks.cancelTask', () => {
    task.cancel();
  });
  
  let convertTask = vscode.commands.registerCommand('tasks.convertTask', () => {
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
    // get current position
    let currentLine: number = editor.selection.active.line;
    // get info
    let info: any = this.getLineinfo(editor, currentLine, config.baseMarker);
    // insert line below or above
    stage ? insertLineBelow() : insertLineAbove();
    // helper-functions
    function insertLineBelow(): any {
      editor.edit( editBuilder => {
        editBuilder.insert(info.lineEnd, '\n\t' + info.marker + ' ');
      });
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
    // get current position
    let currentLine: number = editor.selection.active.line;
    // get info
    let info: any = this.getLineinfo(editor, currentLine, config.completeMarker);
    if (info.containsBase !== -1) {
      // baseMarker => completeMarker
      replaceLine(editor, info, config.baseMarker, info.marker, config.doneMessage, 'append');
    } else if (info.containsComplete !== -1) {
      // completeMarker => baseMarker
      replaceLine(editor, info, info.marker, config.baseMarker, config.doneMessage, '');
    } else if (info.containsCancel !== -1) {
      // cancelMarker => completeMarker 
      replaceLine(editor, info, config.cancelMarker, info.marker, config.cancelMessage, config.doneMessage);
    }
  }
  
  public cancel(): any {
    let editor: any = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    let config: any = this.config;
    let replaceLine: any = this.replaceLine;
    // get current position
    let currentLine: number = editor.selection.active.line;
    // get info
    let info: any = this.getLineinfo(editor, currentLine, config.cancelMarker);
    if (info.containsBase !== -1) {
      // baseMarker => cancelMarker
      replaceLine(editor, info, config.baseMarker, info.marker, config.cancelMessage, 'append');
    } else if (info.containsComplete !== -1) {
      // completeMarker => cancelMarker
      replaceLine(editor, info, config.completeMarker, info.marker, config.doneMessage, config.cancelMessage);
    } else if (info.containsCancel !== -1) {
      // cancelMarker => baseMarker
      replaceLine(editor, info, info.marker, config.baseMarker, config.cancelMessage, '');
    }
  }
  
  public convert(): any {
    let editor: any = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    let config: any = this.config;
    // get current position
    let currentLine: number = editor.selection.active.line;
    // get info
    let info: any = this.getLineinfo(editor, currentLine, config.baseMarker);
    if (info.containsBase === -1 && info.containsComplete === -1 && info.containsCancel === -1) {
      editor.edit( editBuilder => {
        editBuilder.insert(info.firstNonWhitePos, info.marker + ' ');
      });
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
      let prevLineText: string = editor.document.lineAt(lineNumber - 1).text;
      prevLine = new vscode.Position(lineNumber - 1, prevLineText.length);
    }
    let containsBase: number = lineText.indexOf(config.baseMarker);
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
  
  private replaceLine(editor: any, info: any, markerFrom: string, markerTo: string, messageFrom: string, messageTo: string): any {
    let newLine: string;
    if (messageTo === 'append') {
      newLine = info.lineText.replace(markerFrom, markerTo) + messageFrom + ' ( ' + moment().format('MMMM Do YYYY, h:mm:ss a') + ' )';
    } else if (messageTo === '') {
      newLine = info.lineText.replace(markerFrom, markerTo)
      newLine = removeString(newLine, newLine.indexOf(messageFrom), newLine.length);
    } else {
      newLine = info.lineText.replace(markerFrom, markerTo)
      newLine = removeString(newLine, newLine.indexOf(messageFrom), newLine.length);
      newLine = newLine + messageTo + ' ( ' + moment().format('MMMM Do YYYY, h:mm:ss a') + ' )';
    }
    editor.edit (editBuilder => {
      editBuilder.replace(info.lineRange, newLine);
    });
    editor.selection = new vscode.Selection(info.lineEnd, info.lineEnd);
    
    function removeString(str, start, end) {
      return str.substr(0, start) + str.substr(start + end);
    }
  }
  
  dispose(): any {}
}

export function deactivate() {}