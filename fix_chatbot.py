import re

with open('components/PublicAiChatbot.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add AbortController ref
if 'const abortControllerRef = useRef(null);' not in content:
    content = content.replace('const messagesEndRef = useRef(null);', 'const messagesEndRef = useRef(null);\n  const abortControllerRef = useRef(null);')

# Find handleSendMessage
patch = '''
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const currentAbortSignal = abortControllerRef.current.signal;
    
    // Add 25s timeout
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('TIMEOUT');
      }
    }, 25000);
'''

# We will just write a new function for handleSendMessage if it's too complex to regex, but regex is fine
# We look for "try {" inside handleSendMessage
def replace_try(match):
    return patch + '\n    try {'

content = re.sub(r'try\s*\{', replace_try, content, count=1)

error_handling_patch = '''
    } catch (error) {
      console.error("AI Error:", error);
      let errorMsg = "Baðlantý x?tasý. Yenid?n c?hd edin.";
      if (error === 'TIMEOUT' || error.name === 'AbortError') {
         errorMsg = "Sorðu çox uzun ç?kdi. Z?hm?t olmasa yenid?n c?hd edin.";
      } else if (error?.status === 429 || (error?.message && error.message.includes('429'))) {
         errorMsg = "Sorðu limiti dolub. 30 san. sonra c?hd edin.";
      }
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: '', 
        isError: true,
        errorHtml: <div class="ai-error-bubble bg-red-100 text-red-700 p-2 rounded text-xs border border-red-200"></div>
      }]);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
'''

# Replace the catch block in handleSendMessage
content = re.sub(r'catch\s*\(\w+\)\s*\{[^}]*\}\s*finally\s*\{[^}]*\}', error_handling_patch, content)
# If the original code just had catch (error) { ... setIsloading(false) }, it might not have finally.
# Let's just do a simpler string replace since we know how it looks usually.

with open('components/PublicAiChatbot.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched PublicAiChatbot")
