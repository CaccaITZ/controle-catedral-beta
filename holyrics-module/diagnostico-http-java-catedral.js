/*
 * DIAGNÓSTICO — Acesso Java e servidor HTTP no Holyrics
 * Repositório beta: controle-catedral-beta
 *
 * Instale/ative este módulo temporariamente no Holyrics e consulte o log.
 * Não inicia servidor permanente nem altera o módulo de prévia existente.
 */

function info() {
  return {
    id: "catedral_http_runtime_diagnostic",
    name: "Diagnóstico HTTP/Java — Catedral",
    description: "Verifica se o runtime do módulo acessa classes Java e consegue abrir um servidor HTTP local temporário.",
    min_version: "2.24.0",
    available_in_main_window: true,
    available_in_bible_window: false
  };
}

function logResult(label, value) {
  var line = "[Diagnóstico HTTP Catedral] " + label + ": " + String(value);
  try { h.log(line); } catch (e) {}
  try {
    var previous = h.getGlobal("@catedral#http_runtime_diagnostic", []);
    if (!Array.isArray(previous)) previous = [];
    previous.push({ test: label, result: String(value), at: new Date().getTime() });
    h.setGlobal("@catedral#http_runtime_diagnostic", previous);
  } catch (e2) {}
}

function testClass(name) {
  try {
    if (typeof Java !== "undefined" && Java && typeof Java.type === "function") {
      var c = Java.type(name);
      return "OK via Java.type; class=" + String(c);
    }
  } catch (e) {
    return "Java.type falhou: " + String(e && e.message || e);
  }
  try {
    if (typeof Packages !== "undefined" && Packages) {
      var parts = name.split(".");
      var ref = Packages;
      for (var i = 0; i < parts.length; i++) ref = ref[parts[i]];
      return "OK via Packages; class=" + String(ref);
    }
  } catch (e2) {
    return "Packages falhou: " + String(e2 && e2.message || e2);
  }
  try {
    var cls = java.lang.Class.forName(name);
    return "OK via java.lang.Class.forName; class=" + String(cls);
  } catch (e3) {
    return "Acesso Java não disponível ou classe bloqueada: " + String(e3 && e3.message || e3);
  }
}

function startup(module) {
  try { h.setGlobal("@catedral#http_runtime_diagnostic", []); } catch (e) {}

  logResult("runtime", (function() {
    try { return h.getRuntimeEnvironment(); } catch (e) { return "indisponível: " + e; }
  })());
  logResult("Java global", typeof Java);
  logResult("Packages global", typeof Packages);
  logResult("java global", typeof java);
  logResult("HttpServer class", testClass("com.sun.net.httpserver.HttpServer"));
  logResult("ServerSocket class", testClass("java.net.ServerSocket"));
  logResult("InetSocketAddress class", testClass("java.net.InetSocketAddress"));

  // Testa a criação e o bind apenas em loopback e porta efêmera.
  // O servidor é parado imediatamente; nenhuma porta fica aberta.
  var testedHttpServer = false;
  try {
    if (typeof Java !== "undefined" && Java && typeof Java.type === "function") {
      var HttpServer = Java.type("com.sun.net.httpserver.HttpServer");
      var InetSocketAddress = Java.type("java.net.InetSocketAddress");
      var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
      server.start();
      var address = server.getAddress();
      logResult("HTTP bind/start/stop", "SUCESSO em 127.0.0.1:" + address.getPort());
      server.stop(0);
      testedHttpServer = true;
    }
  } catch (e) {
    logResult("HTTP bind/start/stop", "FALHOU: " + String(e && e.message || e));
  }

  if (!testedHttpServer) {
    try {
      if (typeof Java !== "undefined" && Java && typeof Java.type === "function") {
        var ServerSocket = Java.type("java.net.ServerSocket");
        var socket = new ServerSocket();
        socket.bind(new (Java.type("java.net.InetSocketAddress"))("127.0.0.1", 0));
        var port = socket.getLocalPort();
        socket.close();
        logResult("ServerSocket bind/close", "SUCESSO em 127.0.0.1:" + port);
      } else {
        logResult("ServerSocket bind/close", "NÃO TESTADO: Java.type não está disponível");
      }
    } catch (e2) {
      logResult("ServerSocket bind/close", "FALHOU: " + String(e2 && e2.message || e2));
    }
  }

  logResult("fim", "Diagnóstico concluído. Consulte o log do Holyrics e o global @catedral#http_runtime_diagnostic.");
}

function triggers() {
  return [];
}
