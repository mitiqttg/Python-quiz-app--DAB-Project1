<script>
    import { userUuid } from "../stores/stores.js";
    import {
        latestSubmissionId,
        currentFeedback,
        points,
    } from "../stores/assignmentStore.js";

    import AssignmentDescription from "./AssignmentDescription.svelte";
    import SubmitActions from "./SubmitActions.svelte";
    import GraderFeedback from "./GraderFeedback.svelte";

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
        console.log("next");
        assignmentPromise = getAssignment();
        $latestSubmissionId = null;
        $currentFeedback = null;
    };

    let assignmentPromise = getAssignment();
</script>

<div class="container mx-auto columns-1 bg-sky-100">
    {#await assignmentPromise}
        <p class="my-2 px-2 py-2">Loading assignment</p>
    {:then assignment}
        {#if !assignment || assignment.handout === ""}
            <p class="my-2 px-2 py-2">No assignments available</p>
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
                    class="bg-sky-400 mx-4 my-2 px-2 py-2 rounded-[4px] text-white"
                    on:click={nextClicked}>Next</button
                >
            {/if}
        {/if}
    {/await}
</div>
