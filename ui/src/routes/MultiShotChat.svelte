<script lang="ts">
    import { onMount } from 'svelte';
    // https://www.skeleton.dev/elements/chat
    import BubbleSystem from "./BubbleSystem.svelte";
    import BubbleUser from "./BubbleUser.svelte";
    
    let tokenVar: string = '';
    let tokenHistory: { role: string, content: string }[] = [];
    let resultDiv: HTMLDivElement;
    
    const clearToken = () => {
      tokenVar = '';
    };
    
    const checkForReturnKey = (event: KeyboardEvent) => {
      if(event.key === 'Enter' && !event.shiftKey){
        event.preventDefault();
        sendUserTokenAiHistory();
      }
    };
    
    function getToken() {
      return tokenVar;
    }
    
    async function sendUserTokenAiHistory() {
        const token = getToken();
        tokenHistory.push({ role: "user", content: token });

        let divIdUser = addBubble("User", "user");
        await printMessage(divIdUser, token).then(() => {
            // console.log(divIdUser + "- is the id");
        });
        
        const response = await fetchAi(tokenHistory);

        if (!response.body) {
            throw new Error('Response body is null');
        }

        await printResponse(response.body.getReader()
            , new TextDecoder('utf-8'), addBubble("AI", "ai")).then(content => {
                tokenHistory.push({ role: "assistant", content });
        });
        
        clearToken();
    }

    async function printMessage(bubbleId: string, tokens: string) {
      document.getElementById(bubbleId)!.innerHTML += tokens;
      await scrollToBottom();
    }
    
    async function fetchAi(history: { role: string, content: string }[]) {
      let content = JSON.stringify({ messages: history });
      return await fetch('http://localhost:8000/stream_history/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: content
      });
    }
    
    async function printResponse(
            reader: ReadableStreamDefaultReader<Uint8Array>, 
            decoder: TextDecoder, 
            responseDiv: string
        ): Promise<string> {
        
        let lastResponse = '';
        
        async function processResult(result: ReadableStreamReadResult<Uint8Array>): Promise<void> {
            if (result.done) { return; }
            
            let token = decoder.decode(result.value);
            lastResponse += token;
            
            if (token.endsWith('.') || token.endsWith('!') || token.endsWith('?')) {
                document.getElementById(responseDiv)!.innerHTML += `${token}</br>`;
            } else {
                document.getElementById(responseDiv)!.innerHTML += `${token}`;
            }
            
            scrollToBottom();
            return reader.read().then(processResult);
        }
        
        await reader.read().then(processResult);
        return lastResponse;
    }

    const addBubble = (person: string, type: "user" | "ai") => {
        const parentDiv = document.createElement('div');
        let bubbleData = {
            color: 'variant-soft-primary',
            name: person,
            timestamp: new Date().toLocaleTimeString(),
            message: "",
            avatar: `https://i.pravatar.cc/?img=${type === "user" ? 14 : 47}`,
            pid: `pid${Date.now()}`
        };
        let bubble;

        switch (type) {
            case "user":
                bubble = new BubbleUser({ target: parentDiv, props: { bubble: bubbleData } });
                break;
            case "ai":
                bubble = new BubbleSystem({ target: parentDiv, props: { bubble: bubbleData } });
                break;
            default:
                throw new Error("Unsupported type");
        }

        bubble.id = `div${Date.now()}`;
        resultDiv!.appendChild(parentDiv);
        return bubbleData.pid;
    };

    interface Bubble {
        color: string;
        name: string;
        timestamp: string;
        message: string;
        avatar: string;
        pid: string
    }
    interface BubbleComponent {
        id: string;
        bubble: Bubble;
        $set: (props: { bubble: Bubble }) => void;
    }
    
    async function scrollToBottom() {
      return new Promise<void>((resolve) => {
        let element = resultDiv!;
        element.scrollTop = element.scrollHeight;
        resolve();
      });
    }
</script>
<style>
    #result {
        height: 500px;
        overflow-y: auto;
        /*border: 1px solid #e0e0e0;*/
        padding: 10px;
        margin-bottom: 10px;
        border-radius: 3px;
        /*background-color: #fafafa;*/
    }
</style>
<div class="w-[90vw] max-w-[1000px]">
    <div id="result" bind:this={resultDiv}></div>
    <div class="input-group input-group-divider grid-cols-[auto_1fr_auto] rounded-container-token">
        <button class="input-group-shim" on:click={sendUserTokenAiHistory}>+</button>
        <textarea
                bind:value={tokenVar}
                class="bg-transparent border-0 ring-0"
                name="tokenInput"
                id="tokenInput"
                placeholder="Write a message..."
                rows="1"
                on:keydown={checkForReturnKey}
        />
        <button class="variant-filled-primary" on:click={sendUserTokenAiHistory}>Send</button>
    </div>
</div>
