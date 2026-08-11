import ytdl from 'ytdl-core';
async function test() {
    try {
        const info = await ytdl.getInfo('1F_C6HQwuM0');
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
        console.log(format.url.slice(0, 50));
    } catch (e) {
        console.error("Error:", e.message);
    }
}
test();
