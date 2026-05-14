export class PhoneMask {

  /**
   * Aplica máscara de telefone no formato (99) 99999-9999
   */
  static applyMask(value: string): string {
    if (!value) return '';

    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');

    // Aplica a máscara baseada no tamanho
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  }

  /**
   * Remove máscara e retorna apenas números
   */
  static removeMask(value: string): string {
    if (!value) return '';
    return value.replace(/\D/g, '');
  }

  /**
   * Valida se o telefone tem formato correto
   */
  static isValid(value: string): boolean {
    const numbers = PhoneMask.removeMask(value);
    return numbers.length === 10 || numbers.length === 11;
  }

  /**
   * Formata para envio ao backend (apenas números)
   */
  static formatForBackend(value: string): string {
    return PhoneMask.removeMask(value);
  }
}
