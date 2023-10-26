<script>
    import {
        latestSubmissionId,
        currentFeedback,
    } from "../stores/assignmentStore";
</script>

<div class="mx-4 my-4 bg-slate-50 overflow-auto rounded-[4px]">
    <div class="px-2 py-4 space-y-2 text-base">
        {#if !$currentFeedback}
            <p>Waiting for grader feedback...</p>
        {:else if $currentFeedback.correct}
            <p>Submission was correct</p>
            <pre
                class="text-green-700"
                id="graderFeedbackSuccess">{$currentFeedback.feedback}</pre>
        {:else}
            <p>Submission failed</p>
            <pre
                class="text-red-700"
                id="graderFeedbackFail">{$currentFeedback.feedback}</pre>
        {/if}
    </div>
</div>
