import { ChildProcess } from 'child_process';
import { Abortable } from './Abortable';

export interface ProcessResponseResolve {
  code: number;
  signal: string;
}

export class Process extends Abortable<ProcessResponseResolve> {
  public process: ChildProcess;

  private static _ctor(process: ChildProcess): Process {
    const p = new Abortable<ProcessResponseResolve>((resolve, reject, aapi) => {
      process
        .on('exit', (code, signal) => {
          resolve({ code, signal });
        })
        .on('error', err => {
          reject(err);
        });

      aapi.on(() => {
        process.kill();
      });
    }) as Process;

    p.process = process;

    return p;
  }

  // @ts-ignore
  constructor(process: ChildProcess) {
    return Process._ctor(process);
  }
}
