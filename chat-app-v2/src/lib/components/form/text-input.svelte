<script lang="ts">
    export let name: string;
    export let label: string;
    export let placeholder = "";
    export let type = "text";
    export let autocomplete = "nope";
    export let maxlength: number|null = null;

    export let description = "";

    export let disabled = false;
    export let invalid = false;
</script>

<div class="w-full">
    <label for={name} class="{invalid? 'text-red-500' : ''}">{label}</label>

    <div class="relative">
        <input 
            class="
                border-2 p-2 pl-4 pr-12 w-full 
                rounded-2xl border-gray-200 outline-none focus:border-gray-400 transition-all
                {invalid? 'border-red-500 focus:border-red-700' : ''}
            "
            {name}
            {placeholder}
            {type}
            {disabled}
            {autocomplete}
            {maxlength}
            required
            on:input
        />

        <slot />
    </div>

    <small class="text-gray-400 {invalid? 'text-red-500' : ''}">{description}</small>
</div>