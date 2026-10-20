# Integração Holyrics — Prévia de Vídeo Catedral

Esta versão da beta usa o próprio Holyrics para distribuir a URL do vídeo. Não usa OBS WebSocket, PowerShell, servidor receptor separado nem IP individual dos celulares/tablets.

## Arquivos

- `01-modulo-previa-catedral.js`: detecta o evento `displaying / any_video`, calcula a URL autenticada do serviço HTTP de vídeo do Plugin do Holyrics e publica os dados no estado global `@catedral#video_preview`.
- `02-api-server-previa-catedral.js`: ação personalizada `GetCatedralVideoPreview`, que entrega o estado publicado pelo módulo aos aplicativos.
- `www/index.html`: consulta `GetCatedralVideoPreview` e `GetMediaPlayerInfo` pela API do Holyrics, usando o IP configurado no app e a porta API `4455`.

## Fluxo

1. O Holyrics começa a exibir um vídeo.
2. O módulo publica URL, nome, caminho e horário em `@catedral#video_preview`.
3. Cada app Controle Catedral consulta a mesma ação da API do Holyrics periodicamente.
4. O app reproduz a URL autenticada e sincroniza o vídeo com o estado/tempo retornado por `GetMediaPlayerInfo`.

Os dispositivos não precisam ter IP fixo e o módulo não precisa conhecer os endereços dos apps. Não é necessário iniciar um servidor manualmente a cada utilização.

## Configuração no Holyrics

1. Instale e habilite `01-modulo-previa-catedral.js` no Holyrics (requer a versão indicada no módulo).
2. Integre o caso `GetCatedralVideoPreview` de `02-api-server-previa-catedral.js` ao JavaScript personalizado do API Server. **Não substitua a função `request` inteira se ela já contiver outros casos**; incorpore somente o `case` e preserve as demais ações.
3. Confirme que o API Server está acessível pelo endereço e porta configurados no app.
4. Confirme que o endereço incluído na URL `/get_video` é acessível pelos aparelhos na mesma rede e que o serviço HTTP de vídeo do Plugin do Holyrics está ativo.

A ação personalizada usa o mesmo API Server que atende às outras chamadas do aplicativo. Não exige uma porta receptora separada nem um serviço PowerShell.

## Resposta esperada

```json
{
  "status": "ok",
  "data": {
    "available": true,
    "url": "http://IP_DO_HOLYRICS:PORTA/get_video?path=...&token=...",
    "path": "...",
    "name": "...",
    "updated_at": 0
  }
}
```

Os valores são ilustrativos. O módulo gera a URL e o token durante a execução.

## Limites do teste

O código foi integrado à branch beta, mas ainda precisa ser validado no Holyrics real com a ação personalizada instalada. A build estável v6 e o repositório `CaccaITZ/controle-catedral-ios` não devem ser alterados durante esses testes.
