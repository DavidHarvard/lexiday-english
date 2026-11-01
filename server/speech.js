export const SPEECH_MODEL='@cf/myshell-ai/melotts';
export const SPEECH_VERSION='melo-en-v1';
export function prepareSpeechRequest(input){
 if(!input||typeof input.text!=='string'||input.text.length>400)throw Error('每段朗读文字需为 1–400 个字符。');
 const text=input.text.replace(/\s+/g,' ').trim();
 if(!text||!/[A-Za-z]/.test(text)||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text))throw Error('请提供有效的英文朗读内容。');
 return text;
}
export async function generateSpeech(ai,text){
 const result=await ai.run(SPEECH_MODEL,{prompt:text,lang:'en'});
 let bytes;
 if(result instanceof Response){if(!result.ok)throw Error('Speech provider failed');bytes=new Uint8Array(await result.arrayBuffer());}
 else if(result instanceof ReadableStream)bytes=new Uint8Array(await new Response(result).arrayBuffer());
 else if(result instanceof ArrayBuffer||ArrayBuffer.isView(result))bytes=new Uint8Array(result instanceof ArrayBuffer?result:result.buffer.slice(result.byteOffset,result.byteOffset+result.byteLength));
 else if(typeof result?.audio==='string')bytes=Uint8Array.from(atob(result.audio),c=>c.charCodeAt(0));
 if(!bytes||bytes.length<100||bytes.length>5000000)throw Error('Speech provider returned no usable audio');
 // Model deployments may return WAV despite the documented MP3 response.
 // Detect actual bytes so the media element gets the correct Content-Type.
 const tag=new TextDecoder().decode(bytes.subarray(0,12));
 const contentType=tag.startsWith('RIFF')&&tag.slice(8,12)==='WAVE'?'audio/wav':tag.startsWith('OggS')?'audio/ogg':tag.startsWith('ID3')||bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0?'audio/mpeg':null;
 if(!contentType)throw Error('Speech provider returned invalid audio: '+Array.from(bytes.subarray(0,12),b=>b.toString(16).padStart(2,'0')).join(''));
 return {bytes,contentType};
}
