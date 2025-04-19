export default {
    async fetch(request, env) {
      // Set up CORS headers
      const headers = new Headers({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      });
  
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
      }
  
      // Handle GET request with prompt parameter
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
  
      // Handle all other methods
      return new Response('Method not allowed', { status: 405, headers });
    }
<<<<<<< HEAD
  };
=======
  };  
>>>>>>> f669b86247ab08a86f644c075cb0032652dcb893
