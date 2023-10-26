<script>
  import { userUuid } from "../stores/stores.js";
  import { points } from "../stores/assignmentStore.js";

  const getPoints = async () => {
    const response = await fetch("/api/points/" + $userUuid);
    const pointData = await response.json();
    $points = pointData.points;
  };

  getPoints();
</script>

<div class="mx-auto flex flex-row p-4 mb-4 shadow">
  <div class="basis-5/6">
    <span class="text-2xl text-gray-700 font-serif">Hello {$userUuid}! </span>
  </div>
  <div class="basis-1/6 pl-2 text-2xl text-gray-700 font-serif text-right">
    {#if $points || $points === 0}
      <span id="userPoints">{$points} points</span>
    {/if}
  </div>
</div>
