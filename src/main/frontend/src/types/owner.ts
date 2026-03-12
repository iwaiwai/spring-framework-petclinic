export interface PetDto {
  name: string
}

export interface OwnerDto {
  id: number
  firstName: string
  lastName: string
  address: string
  city: string
  telephone: string
  pets: PetDto[]
}
