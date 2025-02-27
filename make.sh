#deno run -A makeblogcsv.js; deno run -A fukunojigjp.js 8085
deno -A makeblogcsv.js; deno serve -A --port=8085 --host='[::]' fukunojigjp.js 
