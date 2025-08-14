// custom-alerts.js

// Sobrescreve a função global `alert`
window.alert = function(mensagem) {
  Swal.fire({
    title: 'Atenção!',
    text: mensagem,
    icon: 'info',
    confirmButtonText: 'OK'
  });
};

// Sobrescreve a função global `confirm`
window.confirm = async function(mensagem) {
  const result = await Swal.fire({
    title: 'Confirmação',
    text: mensagem,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sim',
    cancelButtonText: 'Não'
  });
  return result.isConfirmed;
};

// Sobrescreve a função global `prompt`
window.prompt = async function(mensagem, valorPadrao = '') {
  const { value: texto } = await Swal.fire({
    title: 'Entrada de Dados',
    text: mensagem,
    input: 'text',
    inputValue: valorPadrao,
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar'
  });

  if (texto !== undefined) {
    return texto;
  }
  return null;
};