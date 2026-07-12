
function traduzirLeafletDraw() {
  L.drawLocal = {
    draw: {
      toolbar: {
        actions: { title: 'Cancelar desenho', text: 'Cancelar' },
        finish: { title: 'Finalizar desenho', text: 'Finalizar' },
        undo: { title: 'Deletar último ponto', text: 'Desfazer' },
        buttons: {
          polyline: 'Desenhar uma linha',
          polygon: 'Desenhar um polígono',
          rectangle: 'Desenhar um retângulo',
          circle: 'Desenhar um círculo',
          marker: 'Inserir um marcador',
          circlemarker: 'Inserir um marcador circular'
        }
      },
      handlers: {
        circle: { tooltip: { start: 'Clique e arraste para desenhar o círculo.' }, radius: 'Raio' },
        circlemarker: { tooltip: { start: 'Clique no mapa para posicionar o marcador.' } },
        marker: { tooltip: { start: 'Clique no mapa para posicionar o marcador.' } },
        polygon: {
          tooltip: {
            start: 'Clique para começar a desenhar a área.',
            cont: 'Clique para continuar desenhando.',
            end: 'Clique no primeiro ponto para fechar esta área.'
          }
        },
        polyline: {
          error: '<strong>Erro:</strong> as linhas não podem se cruzar!',
          tooltip: {
            start: 'Clique para começar a desenhar a linha.',
            cont: 'Clique para continuar desenhando.',
            end: 'Clique no último ponto para finalizar.'
          }
        },
        rectangle: { tooltip: { start: 'Clique e arraste para desenhar o retângulo.' } },
        simpleshape: { tooltip: { end: 'Solte o mouse para finalizar o desenho.' } }
      }
    },
    edit: {
      toolbar: {
        actions: {
          save: { title: 'Salvar alterações', text: 'Salvar' },
          cancel: { title: 'Cancelar edição, descarta todas as alterações', text: 'Cancelar' },
          clearAll: { title: 'Limpar todas as camadas', text: 'Limpar Tudo' }
        },
        buttons: {
          edit: 'Editar camadas',
          editDisabled: 'Nenhuma camada para editar',
          remove: 'Deletar camadas',
          removeDisabled: 'Nenhuma camada para deletar'
        }
      },
      handlers: {
        edit: {
          tooltip: {
            text: 'Arraste os quadrados ou marcadores para editar.',
            subtext: 'Clique em cancelar para desfazer as alterações.'
          }
        },
        remove: { tooltip: { text: 'Clique em uma forma para removê-la.' } }
      }
    }
  };
}

