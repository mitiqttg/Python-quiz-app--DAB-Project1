<script>
  import { userUuid } from "../stores/stores.js";
  import { points } from "../stores/assignmentStore.js";

  const getPoints = async () => {
    const response = await fetch("/api/points/" + $userUuid);
    const pointData = await response.json();
    $points = pointData.points ? pointData.points : 0;
  };

  getPoints();
</script>

<div class="mx-auto flex flex-row p-4 mb-4 shadow">
  <div class="basis-11/12  rainbow-text text-center">
    <span class="text-2xl font-serif">
      Hello {$userUuid}! You have {$points} points.
    </span>
  </div>

</div>
