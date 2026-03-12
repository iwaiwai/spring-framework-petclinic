<script setup lang="ts">
import { ref } from 'vue'
import type { OwnerDto } from '@/types/owner'

// Read server-embedded data for immediate rendering
interface EmbeddedData {
  __PETCLINIC_OWNERS__?: OwnerDto[]
  __PETCLINIC_ERROR__?: string
  __PETCLINIC_SEARCH_TERM__?: string
}

const win = window as unknown as EmbeddedData

const owners = ref<OwnerDto[]>(win.__PETCLINIC_OWNERS__ ?? [])
const errorMessage = ref(win.__PETCLINIC_ERROR__ ?? '')
const searchTerm = ref(win.__PETCLINIC_SEARCH_TERM__ ?? '')
const showResults = ref(Array.isArray(win.__PETCLINIC_OWNERS__) && win.__PETCLINIC_OWNERS__.length > 0)
</script>

<template>
  <div v-if="showResults">
    <h2>Owners</h2>

    <table id="ownersTable" class="table table-striped">
      <thead>
        <tr>
          <th scope="col" style="width: 150px;">Name</th>
          <th scope="col" style="width: 200px;">Address</th>
          <th scope="col">City</th>
          <th scope="col" style="width: 120px;">Telephone</th>
          <th scope="col">Pets</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="owner in owners" :key="owner.id">
          <td>
            <a :href="'/owners/' + owner.id">{{ owner.firstName }} {{ owner.lastName }}</a>
          </td>
          <td>{{ owner.address }}</td>
          <td>{{ owner.city }}</td>
          <td>{{ owner.telephone }}</td>
          <td>
            <span v-for="(pet, index) in owner.pets" :key="pet.name">{{ pet.name }}{{ index < owner.pets.length - 1 ? ' ' : '' }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-else>
    <h2>Find Owners</h2>

    <form action="/owners" method="get" class="form-horizontal" id="search-owner-form">
      <div class="form-group">
        <div class="control-group">
          <label for="lastNameInput" class="col-sm-2 control-label">Last name </label>
          <div class="col-sm-10">
            <input
              id="lastNameInput"
              class="form-control"
              name="lastName"
              type="text"
              maxlength="80"
              :value="searchTerm"
            />
            <span v-if="errorMessage" class="help-inline">{{ errorMessage }}</span>
          </div>
        </div>
      </div>
      <div class="form-group">
        <div class="col-sm-offset-2 col-sm-10">
          <button type="submit" class="btn btn-primary">Find Owner</button>
        </div>
      </div>
    </form>

    <br/>
    <a class="btn btn-primary" href="/owners/new">Add Owner</a>
  </div>
</template>
