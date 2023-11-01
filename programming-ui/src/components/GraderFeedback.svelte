<script>
    import { currentFeedback } from "../stores/assignmentStore";
</script>

<div class="mx-4 my-4 bg-gray-200 overflow-auto rounded-[8px]">
    <div class="px-2 py-4 space-y-2 text-black">
        {#if !$currentFeedback}
            <p>Waiting for grader feedback...</p>
        {:else if $currentFeedback.correct}
            <p class="text-green-600">Passed</p>
            <pre
                class="text-green-600"
                id="passFeedback">{$currentFeedback.feedback}</pre>
        {:else}
            <p class="text-red-600">Failed</p>
            <pre
                class="text-red-600"
                id="failFeedback">{$currentFeedback.feedback}</pre>
        {/if}
    </div>
</div>
