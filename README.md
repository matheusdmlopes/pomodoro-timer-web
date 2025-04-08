# Pomodoro Timer Web App

Uma aplicação web simples para gerenciar seus ciclos de trabalho usando a técnica Pomodoro.

## Sobre a Técnica Pomodoro

A Técnica Pomodoro é um método de gerenciamento de tempo desenvolvido por Francesco Cirillo no final dos anos 1980. A técnica usa um cronômetro para dividir o trabalho em intervalos, tradicionalmente de 25 minutos, separados por pequenas pausas.

## Funcionalidades

- Timer Pomodoro completo com contagem regressiva visual
- Ciclos automáticos entre períodos de trabalho e pausas
- Configurações personalizáveis para durações de trabalho e pausas
- Notificações sonoras para mudanças de ciclo
- Contador de sessões para acompanhar o progresso
- Design responsivo para desktop e dispositivos móveis
- Persistência de dados com localStorage
- Indicador de progresso circular

## Tecnologias Utilizadas

- HTML5
- CSS3 (com Flexbox para layout responsivo)
- JavaScript Vanilla (sem dependências de frameworks)
- Web Audio API para notificações sonoras
- LocalStorage API para persistência de dados

## Como Usar

1. Clone este repositório ou baixe os arquivos
2. Abra o arquivo `index.html` em seu navegador
3. Clique em "Iniciar" para começar o timer
4. Use as configurações para personalizar os tempos de trabalho e pausa

## Instalação

Não é necessária nenhuma instalação. Este projeto é executado diretamente no navegador.

```bash
# Clone o repositório
git clone https://github.com/matheusdmlopes/pomodoro-timer-web.git

# Entre no diretório
cd pomodoro-timer-web

# Abra o arquivo index.html em seu navegador
```

## Implantação no GitHub Pages

Para implantar este projeto no GitHub Pages, siga as instruções abaixo:

1. Faça um fork ou clone este repositório para sua conta GitHub
2. Configure seu repositório para publicar a branch principal no GitHub Pages:
   - Vá para **Settings** > **Pages**
   - Em **Source**, selecione **Deploy from a branch**
   - Em **Branch**, selecione **main** e **/ (root)**
   - Clique em **Save**
3. Alternativamente, você pode usar o script de implantação incluído:
   ```bash
   # Torne o script executável
   chmod +x deploy.sh
   
   # Execute o script
   ./deploy.sh
   ```
4. Seu site estará disponível em `https://seunome.github.io/pomodoro-timer-web/`

## Estrutura do Projeto

```
pomodoro-timer-web/
│
├── css/
│   ├── reset.css       # Reset CSS para consistência entre navegadores
│   └── style.css       # Estilos principais da aplicação
│
├── js/
│   ├── main.js         # Ponto de entrada principal e gerenciamento de estados
│   ├── timer.js        # Lógica do temporizador e ciclos Pomodoro
│   └── settings.js     # Gerenciamento de configurações do usuário
│
├── assets/             # Recursos como imagens e sons
├── index.html          # Arquivo HTML principal
├── sitemap.xml         # Sitemap para SEO
└── README.md           # Documentação do projeto
```

## Próximos Passos

- Implementação de funcionalidade de acompanhamento de tarefas
- Estatísticas e análises de uso
- Suporte para PWA (Progressive Web App) para uso offline
- Alternância entre temas claro/escuro
- Opções avançadas de som
- Atalhos de teclado

## Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir um issue ou enviar um pull request.

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes. 