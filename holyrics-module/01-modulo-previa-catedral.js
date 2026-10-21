/*
 * Prévia de vídeo — Catedral
 * Holyrics 2.24+
 *
 * Detecta vídeos exibidos e publica a URL no estado global para o app.
 * A reprodução usa o serviço HTTP de vídeo do Plugin do Holyrics; não usa OBS.
 */

var CATEDRAL_VIDEO_PREVIEW_KEY = "@catedral#video_preview";

function catedralLog(message) {
  try {
    h.log("[Prévia Catedral] " + String(message));
  } catch (e) {}
}

function info() {
  return {
    id: "catedral_video_preview",
    name: "Prévia de Vídeo — Catedral",
    description: "Compartilha com o aplicativo Catedral o endereço do vídeo exibido no Holyrics.",
    min_version: "2.24.0",
    available_in_main_window: true,
    available_in_bible_window: false
  };
}

function settings() {
  return [
    { type: "title", label: "Endereço para reprodução da prévia" },
    {
      id: "video_url_host",
      name: "IP/host do servidor de vídeo",
      description: "Use um endereço acessível pelo aparelho que exibirá a prévia. Deixe vazio para usar o IP da configuração do serviço de vídeo.",
      type: "string",
      default_value: ""
    }
  ];
}

function readPluginVideoSettings() {
  var candidates = ["~$.plugin_system_settings.txt", ".plugin_system_settings.txt"];
  for (var i = 0; i < candidates.length; i++) {
    try {
      catedralLog("Tentando ler configurações em: " + candidates[i]);
      var parsed = JSON.parse(h.readFileAsText(candidates[i]));
      if (parsed && parsed.port && parsed.token) {
        catedralLog("Configuração encontrada em " + candidates[i] +
          "; ip=" + String(parsed.ip || "(vazio)") +
          "; port=" + String(parsed.port) + ". Token omitido.");
        return parsed;
      }
      catedralLog("Arquivo lido, mas não contém ip/port/token utilizáveis: " + candidates[i]);
    } catch (e) {
      catedralLog("Falha ao ler " + candidates[i] + ": " + String(e && e.message || e));
    }
  }
  catedralLog("Nenhuma configuração do serviço de vídeo foi encontrada.");
  return null;
}

function publishCatedralVideoPreview(obj, module) {
  catedralLog("Evento de vídeo recebido. Campos do evento: " + (obj ? Object.keys(obj).join(", ") : "(objeto vazio)"));
  var fullPath = String(obj && obj.file_fullname || "").trim();
  if (!fullPath) {
    catedralLog("O evento não trouxe file_fullname; não é possível construir a URL.");
    h.setGlobal(CATEDRAL_VIDEO_PREVIEW_KEY, {
      available: false,
      message: "O Holyrics não forneceu o caminho completo do vídeo.",
      updated_at: new Date().getTime()
    });
    return;
  }

  var videoSettings = readPluginVideoSettings();
  if (!videoSettings) {
    catedralLog("Sem configuração do serviço de vídeo; publicando available=false.");
    h.setGlobal(CATEDRAL_VIDEO_PREVIEW_KEY, {
      available: false,
      path: fullPath,
      message: "Não foi possível ler a configuração do serviço HTTP de vídeo do Plugin do Holyrics.",
      updated_at: new Date().getTime()
    });
    return;
  }

  try {
    var host = String(module && module.settings && module.settings.video_url_host || videoSettings.ip || "").trim();
    if (!host) throw new Error("O host do servidor de vídeo não está configurado.");

    catedralLog("Construindo URL para o arquivo: " + fullPath);
    var token = h.sha256(fullPath + "#" + videoSettings.token);
    token = h.base64Encode(token).replace(/[^a-zA-Z0-9]/g, "").substring(0, 20);
    var port = String(videoSettings.port);
    var url = "http://" + host + (port === "80" ? "" : ":" + port) +
      "/get_video?path=" + encodeURIComponent(fullPath) + "&token=" + token;
    var normalized = fullPath.replace(/\\/g, "/");

    catedralLog("URL construída: host=" + host + "; port=" + port + "; rota=/get_video. Token omitido.");
    h.setGlobal(CATEDRAL_VIDEO_PREVIEW_KEY, {
      available: true,
      url: url,
      path: fullPath,
      name: normalized.substring(normalized.lastIndexOf("/") + 1),
      updated_at: new Date().getTime()
    });
    catedralLog("URL publicada no global " + CATEDRAL_VIDEO_PREVIEW_KEY + ".");
  } catch (e) {
    catedralLog("Erro ao construir/publicar URL: " + String(e && e.message || e));
    h.setGlobal(CATEDRAL_VIDEO_PREVIEW_KEY, {
      available: false,
      path: fullPath,
      message: String(e && e.message || "Falha ao gerar a URL do vídeo."),
      updated_at: new Date().getTime()
    });
  }
}

function startup(module) {
  catedralLog("Módulo iniciado. Host configurado no módulo: " +
    String(module && module.settings && module.settings.video_url_host || "(vazio; usa configuração do plugin)"));
  h.setGlobal(CATEDRAL_VIDEO_PREVIEW_KEY, {
    available: false,
    message: "Aguardando o próximo vídeo exibido pelo Holyrics.",
    updated_at: new Date().getTime()
  });
}

function triggers(module) {
  return [{
    name: "Publicar URL do vídeo exibido",
    when: "displaying",
    item: "any_video",
    action: function (obj) {
      catedralLog("Trigger displaying/any_video acionado.");
      publishCatedralVideoPreview(obj, module);
    }
  }];
}
