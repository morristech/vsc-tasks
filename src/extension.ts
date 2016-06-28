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
      }).then(() =>{
        let nextLineEnd: vscode.Position = editor.document.lineAt(currentLine + 1).range.end;
        editor.selection = new vscode.Selection(nextLineEnd, nextLineEnd);
      });
    }
    function insertLineAbove(): any {
      editor.edit( editBuilder => {
        editBuilder.insert(info.prevLine, '\n\t' + info.marker + ' ');
      }).then(() => {
        editor.selection = new vscode.Selection(info.lineEnd, info.lineEnd);
      });
    }
  }
  
  public complete(): any {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    let config: any = this.config;
    let replaceLine: any = this.replaceLineMulti;
    // get all selected lines
    let infos: any = [];
    editor.selections.forEach(line => {
      infos.push(this.getLineinfo(editor, line.active.line, config.completeMarker));
    });
    editor.edit (editBuilder => {
      infos.forEach(info => {
        if (info.containsBase !== -1) {
          // baseMarker => completeMarker
          replaceLine(editBuilder, info, config.baseMarker, info.marker, config.doneMessage, 'append');
        } else if (info.containsComplete !== -1) {
          // completeMarker => baseMarker
          replaceLine(editBuilder, info, info.marker, config.baseMarker, config.doneMessage, '');
        } else if (info.containsCancel !== -1) {
          // cancelMarker => completeMarker 
          replaceLine(editBuilder, info, config.cancelMarker, info.marker, config.cancelMessage, config.doneMessage);
        }
      });
    }).then(() => {
      for (var i = 0; i < editor.selections.length; i++) {
        let line = editor.document.lineAt(editor.selections[i].active.line);
        editor.selections[i] = new vscode.Selection(line.range.end, line.range.end);
      }
    });
  }
  
  public cancel(): any {
    let editor: any = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    let config: any = this.config;
    let replaceLine: any = this.replaceLineMulti;
    // get all selected lines
    let infos: any = [];
    editor.selections.forEach(line => {
      infos.push(this.getLineinfo(editor, line.active.line, config.cancelMarker));
    });
    editor.edit (editBuilder => {
      infos.forEach(info => {
        if (info.containsBase !== -1) {
          // baseMarker => cancelMarker
          replaceLine(editBuilder, info, config.baseMarker, info.marker, config.cancelMessage, 'append');
        } else if (info.containsComplete !== -1) {
          // completeMarker => cancelMarker
          replaceLine(editBuilder, info, config.completeMarker, info.marker, config.doneMessage, config.cancelMessage);
        } else if (info.containsCancel !== -1) {
          // cancelMarker => baseMarker
          replaceLine(editBuilder, info, info.marker, config.baseMarker, config.cancelMessage, '');
        }
      });
    }).then(() => {
      for (var i = 0; i < editor.selections.length; i++) {
        let line = editor.document.lineAt(editor.selections[i].active.line);
        editor.selections[i] = new vscode.Selection(line.range.end, line.range.end);
      }
    });
  }
  
  public convert(): any {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    let config: any = this.config;
    // convert all selected lines
    editor.edit (editBuilder => {
      editor.selections.forEach(line => {
        let info: any = this.getLineinfo(editor, line.start.line, config.baseMarker);
        if (info.containsBase === -1 && info.containsComplete === -1 && info.containsCancel === -1) {
          editBuilder.insert(info.firstNonWhitePos, info.marker + ' ');
          for (var i = line.start.line + 1; i <= line.end.line; i++)
          {
            let line = editor.document.lineAt(i);
            editBuilder.insert(new vscode.Position(i, line.firstNonWhitespaceCharacterIndex), '   ');
          }
        }
      });
    })
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
    editor.edit (editBuilder => {
      this.replaceLineMulti(editBuilder, info, markerFrom, markerTo, messageFrom, messageTo);
    }).then(() => {
      editor.selection = new vscode.Selection(info.lineEnd, info.lineEnd);
    });
  }
  
  private replaceLineMulti(editBuilder: any, info: any, markerFrom: string, markerTo: string, messageFrom: string, messageTo: string): any {
    let newLine: string;
    let format: string = 'MMMM Do YYYY, H:mm';
    if (messageTo === 'append') {
      newLine = info.lineText.replace(markerFrom, markerTo) + messageFrom + ' (' + moment().format(format) + ')';
    } else if (messageTo === '') {
      newLine = info.lineText.replace(markerFrom, markerTo)
      newLine = removeString(newLine, newLine.indexOf(messageFrom), newLine.length);
    } else {
      newLine = info.lineText.replace(markerFrom, markerTo)
      newLine = removeString(newLine, newLine.indexOf(messageFrom), newLine.length);
      newLine = newLine + messageTo + ' (' + moment().format(format) + ')';
    }
    editBuilder.replace(info.lineRange, newLine);
    
    function removeString(str, start, end) {
      return str.substr(0, start) + str.substr(start + end);
    }
  }
  
  dispose(): any {}
}

export function deactivate() {}