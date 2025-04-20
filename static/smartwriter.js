export default {
    async fetch(request, env) {
      const headers = new Headers({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      });
  
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
      }
  
      if (request.method === 'GET') {
        const url = new URL(request.url);
        const prompt = url.searchParams.get('prompt') || 'Tell me something about AI.';
  
        const input = {
          prompt: prompt
        };
  
        try {
          const result = await env.AI.run('@cf/meta/llama-3-8b-instruct', input);
          const responseData = [{
            inputs: input,
            response: result
          }];
  
          return new Response(JSON.stringify(responseData), {
            status: 200,
            headers: headers
          });
        } catch (error) {
          return new Response(
            JSON.stringify({ error: 'Failed to process prompt', detail: error.message }),
            { status: 500, headers }
          );
        }
      }
  
      return new Response('Method not allowed', { status: 405, headers });
    }
  };
