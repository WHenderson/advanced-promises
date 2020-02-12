import {Abortable} from "../src/Abortable";
import {Timeout} from "../src/Timeout";

it('nested', async () => {
    const waitOuter = Abortable.fromAsync(async (aapi) => {
        await Promise.resolve();

        console.log('> outer');
        const EX_ABORT = new Error('abort inner');

        const waitInner = Abortable.fromAsync(async (aapi) => {
            await Promise.resolve();

            console.log('> inner');

            await new Timeout(1000).withAutoCancel(aapi);

            console.log('< inner');
            return 'something';
        }).withTimeout(1000, { reject: new Error('timeout inner')}).withAutoAbort(aapi, { reject: EX_ABORT });

        try {
            return await waitInner;
        }
        catch (ex) {
            console.log('inner ex', ex);
            if (ex !== EX_ABORT)
                throw ex;
        }
        finally {
            console.log('< outer');
        }

        /*
        const result = await aapi.withHandler(
            async () => {
                console.log('>>inner');
                try {
                    await waitInner;
                }
                catch (ex) {
                    console.log('inner ex', ex);
                    if (ex !== EX_ABORT)
                        throw ex;
                }
                finally {
                    console.log('<<inner');
                }
            },
            () => {
                console.log('handle abort (from outer)');
                waitInner.abortWith({ reject: EX_ABORT});
            }
        );
        */
    }).withTimeout(50, { reject: new Error('timeout outer')});

    console.log('begin');
    try {
        const result = await waitOuter;
        console.log('result:', result);
    }
    catch (ex) {
        console.log('ex:', ex);
    }
    console.log('end');
});