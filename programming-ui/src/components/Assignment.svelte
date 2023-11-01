<script>
    import { userUuid } from "../stores/stores.js";
    import SubmitActions from "./SubmitActions.svelte";
    import GraderFeedback from "./GraderFeedback.svelte";
    import AssignmentDescription from "./AssignmentDescription.svelte";
    import { latestSubmissionId, currentFeedback, points } from "../stores/assignmentStore.js";


    const getAssignment = async () => {
        const response = await fetch("/api/next/" + $userUuid);
        return await response.json();
    };

    const fetchFeedback = async () => {
        const delay = (ms) => new Promise((res) => setTimeout(res, ms));

        let response = await fetch("/api/feedback/" + $latestSubmissionId);
        let feedbackData = await response.json();

        while (!feedbackData.status || feedbackData.status == "pending") {
            await delay(1000);
            response = await fetch("/api/feedback/" + $latestSubmissionId);
            feedbackData = await response.json();
        }

        $currentFeedback = feedbackData;

        if ($currentFeedback && $currentFeedback.correct) {
            const response = await fetch("/api/points/" + $userUuid);
            const pointData = await response.json();
            $points = pointData.points;
        }
    };

    const onSubmit = async () => {
        fetchFeedback();
    };

    const nextClicked = () => {
        assignmentPromise = getAssignment();
        $latestSubmissionId = null;
        $currentFeedback = null;
    };

    let assignmentPromise = getAssignment();
</script>

<div class="container mx-auto columns-1 bg-indigo-200 rounded-[8px]">
    {#await assignmentPromise}
        <p class="my-2 px-2 py-2 text-center">Loading</p>
    {:then assignment}
        {#if !assignment || assignment.handout === ""}
            <p class="my-2 px-2 py-2 text-center text-black">No available assignment</p>
        {:else}
            <AssignmentDescription
                title={assignment.title}
                handout={assignment.handout}
            />
            <SubmitActions assignmentID={assignment.id} {onSubmit} />
            {#if $latestSubmissionId}
                <GraderFeedback />
            {/if} 
            {#if $currentFeedback && $currentFeedback.correct}
                <button
                    class="bg-indigo-500 hover:bg-indigo-800 mx-4 my-2 px-2 py-2 rounded-[8px] text-gray-300 hover:text-white"
                    on:click={nextClicked}>
                    Next
                </button>
            {/if}
        {/if}
    {/await}
</div>
