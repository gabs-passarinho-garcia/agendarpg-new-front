export interface UserModel {
  id?: string | number,
  email: string,
  password: string,
  nomeCompleto: string,
  apelido: string,
  dataDeNascimento: string,
  tipo: string,
  telefone: string,
  menor: string,
  responsavel?: string,
  telefoneResponsavel?: string
}
