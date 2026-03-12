package org.springframework.samples.petclinic.web;

import java.util.List;

/**
 * DTO for transferring owner data to the Vue frontend as JSON.
 */
public record OwnerDto(
	int id,
	String firstName,
	String lastName,
	String address,
	String city,
	String telephone,
	List<PetDto> pets
) {
	public record PetDto(String name) {}
}
