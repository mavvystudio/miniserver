import http from 'node:http';
import busboy from 'busboy';

export const handleMultipartForm = (
  req: http.IncomingMessage,
  resolve: any,
) => {
  const data: any = {};
  const bb = busboy({ headers: req.headers });

  bb.on('field', (name, val) => {
    data[name] = val;
  });

  bb.on('file', async (name, file, info) => {
    const save = new Promise((resolve) => {
      const fileDataArr: string[] = [];
      file.on('data', (d) => {
        fileDataArr.push(d);
      });
      file.on('close', () => {
        resolve(fileDataArr.join(''));
      });
    });
    const saveData = await save;
    data[name] = {
      ...info,
      fileData: saveData,
    };
  });

  bb.on('close', () => {
    const { handler, ...input } = data;
    resolve({
      handler,
      input,
    });
  });

  req.pipe(bb);
};
