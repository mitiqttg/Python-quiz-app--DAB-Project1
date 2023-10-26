<script>
    import { userUuid } from "../stores/stores.js";
    import {
        latestSubmissionId,
        currentFeedback,
    } from "../stores/assignmentStore.js";
    export let assignmentID;
    export let onSubmit;

    let submissionText = "";

    const submitAssignment = async (code) => {
        if (submissionText.trim() === "") {
            return;
        }

        const data = {
            assignmentID: assignmentID,
            user: $userUuid,
            code: submissionText,
        };

        const response = await fetch("/api/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const jsonData = await response.json();
        const submissionId = jsonData.id;

        if (submissionId === -1) {
            alert(
                "Wait for previous submission to be graded before submitting again."
            );
            return;
        }

        $currentFeedback = null;
        $latestSubmissionId = submissionId;
        onSubmit();
    };
</script>

<div class="mx-4 my-4 grid-cols-1">
    <div class="relative w-full min-w-[200px]">
        <textarea
            class="peer h-full min-h-[100px] w-full resize-none rounded-[7px]
            px-3 py-2.5 font-sans text-sm font-normal
            text-blue-gray-700 outline outline-0
            border-2 border-sky-200
            focus:border-sky-300
            bg-slate-50"
            placeholder="Add your code here"
            bind:value={submissionText}
        />
    </div>
    <div>
        <button
            class="bg-sky-400 my-2 px-2 py-2 rounded-[4px] text-white"
            on:click={submitAssignment}>
            Submit
        </button>
    </div>
</div>
