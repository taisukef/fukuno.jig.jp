#deno run -A makeblogcsv.js; deno run -A fukunojigjp.js 8085
#deno serve -A --port=8085 --host='[::]' fukunojigjp.js 
deno -A makeblogcsv.js; deno serve -A --port=8085 --host='[::]' fukunojigjp.js 
#deno -A makeblogcsv.js; deno serve -A --port=7001 --host='[::]' fukunojigjp.js 
