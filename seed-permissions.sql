-- Permissões básicas (não críticas)
INSERT INTO permissions (id, code, name, description, is_critical, requires_verified, requires_official, active, created_at, updated_at) VALUES
('perm_email', 'email', 'E-mail', 'Acesso ao seu endereço de e-mail', 0, 0, 0, 1, strftime('%s', 'now'), strftime('%s', 'now')),
('perm_name', 'name', 'Nome', 'Acesso ao seu nome completo', 0, 0, 0, 1, strftime('%s', 'now'), strftime('%s', 'now')),
('perm_avatar', 'avatar', 'Foto de perfil', 'Acesso à sua foto de perfil', 0, 0, 0, 1, strftime('%s', 'now'), strftime('%s', 'now')),
('perm_auth', 'auth', 'Autenticação básica', 'Acesso às suas informações básicas de perfil (nome, e-mail e foto)', 0, 0, 0, 1, strftime('%s', 'now'), strftime('%s', 'now'));

-- Permissões críticas (requerem verificação)
INSERT INTO permissions (id, code, name, description, is_critical, requires_verified, requires_official, active, created_at, updated_at) VALUES
('perm_profile_edit', 'profile:edit', 'Editar perfil', 'Permite ao aplicativo alterar suas informações de perfil (nome e foto)', 1, 1, 0, 1, strftime('%s', 'now'), strftime('%s', 'now')),
('perm_email_change', 'email:change', 'Alterar e-mail', 'Permite ao aplicativo solicitar alteração do seu endereço de e-mail', 1, 1, 0, 1, strftime('%s', 'now'), strftime('%s', 'now')),
('perm_password_change', 'password:change', 'Alterar senha', 'Permite ao aplicativo alterar sua senha', 1, 1, 0, 1, strftime('%s', 'now'), strftime('%s', 'now'));

-- Permissões oficiais (apenas para Epistolários oficiais)
INSERT INTO permissions (id, code, name, description, is_critical, requires_verified, requires_official, active, created_at, updated_at) VALUES
('perm_account_delete', 'account:delete', 'Excluir conta', 'Permite ao aplicativo excluir permanentemente sua conta', 1, 1, 1, 1, strftime('%s', 'now'), strftime('%s', 'now')),
('perm_2fa_manage', '2fa:manage', 'Gerenciar 2FA', 'Permite ao aplicativo ativar ou desativar autenticação de dois fatores', 1, 1, 1, 1, strftime('%s', 'now'), strftime('%s', 'now'));
