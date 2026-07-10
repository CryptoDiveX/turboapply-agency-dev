<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$context = json_decode(file_get_contents(__DIR__ . '/ai/turboapply-agency-context.json'), true);

function respond($payload) { echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES); exit; }
function rpc_result($id, $result) { respond(['jsonrpc' => '2.0', 'id' => $id, 'result' => $result]); }
function rpc_error($id, $code, $message) { respond(['jsonrpc' => '2.0', 'id' => $id, 'error' => ['code' => $code, 'message' => $message]]); }

function validate_inquiry($args) {
  $name = trim((string)($args['name'] ?? ''));
  $contact = trim((string)($args['contact'] ?? ''));
  $message = trim((string)($args['message'] ?? $args['challenge'] ?? ''));
  $errors = [];
  if (mb_strlen($name) < 2) $errors[] = 'Name must be at least 2 characters.';
  if (mb_strlen($contact) < 5) $errors[] = 'A valid email, phone, or messenger contact is required.';
  if (mb_strlen($message) < 8) $errors[] = 'Message/challenge must be at least 8 characters.';
  if (preg_match('/https?:\/\/|<a\s|\[url=/i', $message . ' ' . $contact)) $errors[] = 'Links are not accepted in public MCP inquiry validation.';
  if (preg_match('/casino|crypto airdrop|loan offer|seo backlinks/i', $message)) $errors[] = 'Promotional/spam-like inquiry rejected.';
  return ['valid' => count($errors) === 0, 'errors' => $errors, 'normalized' => ['name' => $name, 'contact' => $contact, 'message' => $message]];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  respond(['name' => 'turboapply-agency', 'protocol' => 'mcp', 'transport' => 'streamable-http', 'context' => '/ai/turboapply-agency-context.json', 'tools' => ['get_site_overview','list_services','get_booking_options','get_form_requirements','validate_contact_inquiry','submit_contact_inquiry']]);
}

$raw = file_get_contents('php://input');
$req = json_decode($raw ?: '{}', true);
$id = $req['id'] ?? null;
$method = $req['method'] ?? '';
$params = $req['params'] ?? [];

if ($method === 'initialize') {
  rpc_result($id, ['protocolVersion' => '2024-11-05', 'serverInfo' => ['name' => 'turboapply-agency', 'version' => '1.0.0'], 'capabilities' => ['tools' => new stdClass()]]);
}
if ($method === 'tools/list') {
  rpc_result($id, ['tools' => [
    ['name'=>'get_site_overview','description'=>'Return public TurboApply site overview.','inputSchema'=>['type'=>'object','properties'=>new stdClass()]],
    ['name'=>'list_services','description'=>'List public TurboApply services.','inputSchema'=>['type'=>'object','properties'=>new stdClass()]],
    ['name'=>'get_booking_options','description'=>'Return public booking/contact options.','inputSchema'=>['type'=>'object','properties'=>new stdClass()]],
    ['name'=>'get_form_requirements','description'=>'Return public contact/lead form fields and safety rules.','inputSchema'=>['type'=>'object','properties'=>new stdClass()]],
    ['name'=>'validate_contact_inquiry','description'=>'Validate an inquiry without submitting it.','inputSchema'=>['type'=>'object','properties'=>['name'=>['type'=>'string'],'contact'=>['type'=>'string'],'message'=>['type'=>'string']]]],
    ['name'=>'submit_contact_inquiry','description'=>'Guarded inquiry submit. Defaults to dry-run and requires confirmSubmit=true for live submit.','inputSchema'=>['type'=>'object','properties'=>['name'=>['type'=>'string'],'contact'=>['type'=>'string'],'message'=>['type'=>'string'],'dry_run'=>['type'=>'boolean'],'confirmSubmit'=>['type'=>'boolean']]]]
  ]]);
}
if ($method === 'tools/call') {
  $name = $params['name'] ?? '';
  $args = $params['arguments'] ?? [];
  if ($name === 'get_site_overview') rpc_result($id, ['content' => [['type'=>'text','text'=>json_encode($context, JSON_UNESCAPED_SLASHES)]]]);
  if ($name === 'list_services') rpc_result($id, ['content' => [['type'=>'text','text'=>json_encode($context['services'] ?? [], JSON_UNESCAPED_SLASHES)]]]);
  if ($name === 'get_booking_options') rpc_result($id, ['content' => [['type'=>'text','text'=>json_encode(['booking'=>'https://turboapply.agency/book-meeting/','email'=>$context['email'],'phone'=>$context['phone']], JSON_UNESCAPED_SLASHES)]]]);
  if ($name === 'get_form_requirements') rpc_result($id, ['content' => [['type'=>'text','text'=>json_encode($context['forms'] ?? [], JSON_UNESCAPED_SLASHES)]]]);
  if ($name === 'validate_contact_inquiry') rpc_result($id, ['content' => [['type'=>'text','text'=>json_encode(validate_inquiry($args), JSON_UNESCAPED_SLASHES)]]]);
  if ($name === 'submit_contact_inquiry') {
    $dry = !array_key_exists('dry_run', $args) || $args['dry_run'] !== false;
    $confirmed = ($args['confirmSubmit'] ?? false) === true;
    $validation = validate_inquiry($args);
    if (!$validation['valid']) rpc_result($id, ['content' => [['type'=>'text','text'=>json_encode(['submitted'=>false,'dry_run'=>$dry,'validation'=>$validation], JSON_UNESCAPED_SLASHES)]]]);
    if ($dry || !$confirmed) rpc_result($id, ['content' => [['type'=>'text','text'=>json_encode(['submitted'=>false,'dry_run'=>true,'requires'=>'confirmSubmit=true and dry_run=false for live submission','validation'=>$validation], JSON_UNESCAPED_SLASHES)]]]);
    rpc_result($id, ['content' => [['type'=>'text','text'=>json_encode(['submitted'=>false,'reason'=>'Live MCP submit is intentionally disabled until the production form endpoint is wired through managed secrets.','validation'=>$validation], JSON_UNESCAPED_SLASHES)]]]);
  }
}
rpc_error($id, -32601, 'Method not found');
?>
