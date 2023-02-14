<script lang="ts">
    export let checked: boolean;
</script>

<div class="checkbox" on:click={() => {checked = !checked}}>
    <input type=checkbox bind:checked={checked}>
    <slot/>
</div>