import * as process from 'process';
import {Timeout} from "../../src/Timeout";

(async function () {
    console.log('begin');

    const duration = process.env.MY_DURATION
        ? parseInt(process.env.MY_DURATION, 10)
        : 0;

    console.log(`duration ${duration}ms`);

    if (duration)
        await new Timeout(duration);

    if (process.env.MY_ERROR)
        throw new Error(process.env.MY_ERROR);

    const exitCode = process.env.MY_EXIT
        ? parseInt(process.env.MY_EXIT, 10)
        : -1;

    console.log(`done, exiting with code ${exitCode}`);
    console.log('');
    process.exit(exitCode);
    return;
})();

