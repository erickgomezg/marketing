import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MoreHorizontal, Search, UserPlus, X } from 'lucide-react';
import { Avatar, Card, PageTitle } from '../../components/common/UI.jsx';
import TablePagination from '../../components/common/TablePagination.jsx';

const blankForm = () => ({ displayName: '', email: '', role: 'Viewer' });

export default function UsersPage() {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState(location.state?.searchQuery || '');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [openActions, setOpenActions] = useState(null);
  const [notice, setNotice] = useState(null);
  const [options, setOptions] = useState([]);
  const [modal, setModal] = useState(null);
  const [permissionLoading, setPermissionLoading] = useState(false);

  const reloadUsers = useCallback(async () => {
    const response = await fetch('/api/access/users');
    if (!response.ok) throw new Error('No se pudo cargar el equipo autorizado.');
    const rows = await response.json();
    setUsers(rows.map((user) => ({
      id: user.UserId, name: user.DisplayName, email: user.Email, role: user.Role,
      status: user.InvitationStatus === 'Invited' ? 'Invitado' : user.IsActive ? 'Activo' : user.ActivatedAt ? 'Inactivo' : 'Pendiente',
      joined: new Date(user.CreatedAt).toLocaleDateString('es-GT'),
      initials: user.DisplayName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(),
      color: 'blue',
    })));
  }, []);

  useEffect(() => {
    reloadUsers().catch((error) => setNotice({ text: error.message }));
    fetch('/api/access/assignment-options').then((response) => response.ok ? response.json() : Promise.reject())
      .then(setOptions).catch(() => setOptions([]));
  }, [reloadUsers]);
  useEffect(() => {
    if (location.state?.searchQuery) { setQuery(location.state.searchQuery); setPage(1); }
  }, [location.state]);

  const filteredUsers = useMemo(() => users.filter((user) => `${user.name} ${user.email} ${user.role} ${user.status}`.toLowerCase().includes(query.toLowerCase())), [users, query]);
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const visible = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  const makeDialog = async (user = null) => {
    setPermissionLoading(true);
    let active = new Set();
    if (user?.role === 'Viewer') {
      try {
        const response = await fetch(`/api/access/users/${user.id}/permissions`);
        if (!response.ok) throw new Error('No se pudieron cargar los permisos actuales.');
        active = new Set((await response.json()).filter((row) => row.IsActive).map((row) => `${row.BusinessId}:${row.SocialPlatformId}`));
      } catch (error) { setNotice({ text: error.message }); setPermissionLoading(false); return; }
    }
    setModal({ mode: user ? 'edit' : 'create', step: 'form', user, form: user ? { displayName: user.name, email: user.email, role: user.role } : blankForm(), selected: active });
    setPermissionLoading(false);
    setOpenActions(null);
  };

  const assignmentPayload = () => options.filter((item) => modal.selected.has(`${item.BusinessId}:${item.SocialPlatformId}`))
    .map((item) => ({ businessId: item.BusinessId, socialPlatformId: item.SocialPlatformId }));

  const toggleAssignment = (businessId, platformId) => {
    const key = `${businessId}:${platformId}`;
    setModal((current) => {
      const selected = new Set(current.selected);
      selected.has(key) ? selected.delete(key) : selected.add(key);
      return { ...current, selected };
    });
  };

  const submitCreate = async () => {
    const assignments = modal.form.role === 'Viewer' ? assignmentPayload() : [];
    const response = await fetch('/api/access/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...modal.form, assignments }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setNotice({ text: body.error || 'No se pudo crear el usuario.' }); return; }
    setModal(null);
    setNotice({ text: 'Usuario creado. La invitación quedó registrada en el Outbox.', actionLink: body.developmentActionLink });
    await reloadUsers();
  };

  const submitEdit = async () => {
    const profileResponse = await fetch(`/api/access/users/${modal.user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: modal.form.displayName, email: modal.form.email }) });
    const profileBody = await profileResponse.json().catch(() => ({}));
    if (!profileResponse.ok) { setNotice({ text: profileBody.error || 'No se pudo actualizar el usuario.' }); return; }
    if (modal.form.role !== modal.user.role) {
      const response = await fetch(`/api/access/users/${modal.user.id}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: modal.form.role, assignments: modal.form.role === 'Viewer' ? assignmentPayload() : [] }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) { setNotice({ text: body.error || 'No se pudo cambiar el rol.' }); await reloadUsers(); return; }
    } else if (modal.form.role === 'Viewer') {
      const response = await fetch(`/api/access/users/${modal.user.id}/permissions`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignments: options.map((item) => ({ businessId: item.BusinessId, socialPlatformId: item.SocialPlatformId, isActive: modal.selected.has(`${item.BusinessId}:${item.SocialPlatformId}`) })) }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) { setNotice({ text: body.error || 'No se pudieron guardar los permisos.' }); await reloadUsers(); return; }
    }
    setModal(null); setNotice({ text: 'Cambios guardados.' }); await reloadUsers();
  };

  const resendInvitation = async (user) => {
    const response = await fetch(`/api/access/users/${user.id}/invitation/resend`, { method: 'POST' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setNotice({ text: body.error || 'No se pudo reenviar la invitación.' }); return; }
    setNotice({ text: 'Invitación reenviada o en cola de envío.', actionLink: body.developmentActionLink });
    setOpenActions(null); await reloadUsers();
  };
  const revokeInvitation = async (user) => {
    const response = await fetch(`/api/access/users/${user.id}/invitation/revoke`, { method: 'POST' });
    if (!response.ok) { setNotice({ text: 'No se pudo revocar la invitación.' }); return; }
    setNotice({ text: 'Invitación revocada.' }); setOpenActions(null); await reloadUsers();
  };
  const toggleUser = async (user) => {
    const response = await fetch(`/api/access/users/${user.id}/active`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: user.status !== 'Activo' }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setNotice({ text: body.error || 'No se pudo cambiar el estado.' }); return; }
    setOpenActions(null); await reloadUsers();
  };

  const groupedOptions = useMemo(() => options.reduce((groups, item) => {
    (groups[item.BusinessId] ||= { name: item.BusinessName, platforms: [] }).platforms.push(item);
    return groups;
  }, {}), [options]);

  return <div className="page users-page">
    <PageTitle eyebrow="Equipo de trabajo" title="Usuarios" description="Administra usuarios, invitaciones y permisos." action={<button className="button-primary" onClick={() => makeDialog()} disabled={permissionLoading}><UserPlus size={16} />Crear usuario</button>} />
    {notice && <div className="inline-notice"><span>i</span>{notice.text}{notice.actionLink && <a href={notice.actionLink}>Abrir enlace de prueba</a>}<button onClick={() => setNotice(null)}>Cerrar</button></div>}
    <div className="user-summary-row"><Card><span className="user-summary-icon blue-soft"><UserPlus size={17} /></span><div><small>PERSONAS EN EL ESPACIO</small><strong>{users.length} usuarios</strong></div></Card><Card><span className="user-summary-icon green-soft"><span>●</span></span><div><small>ACCESO ACTIVO</small><strong>{users.filter((user) => user.status === 'Activo').length} miembros</strong></div></Card><Card><span className="user-summary-icon purple-soft"><span>✉</span></span><div><small>INVITACIONES</small><strong>{users.filter((user) => ['Invitado', 'Pendiente'].includes(user.status)).length} pendientes</strong></div></Card></div>
    <Card className="users-table-card"><div className="users-table-heading"><div><h2>Miembros del equipo</h2><p>Usuarios y estado de activación</p></div><label className="table-search"><Search size={16} /><input placeholder="Buscar usuario" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label></div>
      <div className="table-scroll"><table className="data-table users-table"><thead><tr><th>PERSONA</th><th>ROL</th><th>ESTADO</th><th>FECHA DE ALTA</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{visible.map((user) => <tr key={user.id}><td><div className="user-cell"><Avatar initials={user.initials} color={user.color} /><span><strong>{user.name}</strong><small>{user.email}</small></span></div></td><td><span className={`role-badge role-${user.role.toLowerCase()}`}>{user.role}</span></td><td><span className={`user-status ${user.status === 'Activo' ? 'active' : user.status === 'Inactivo' ? 'inactive' : 'invited'}`}><i />{user.status}</span></td><td>{user.joined}</td><td className="actions-cell"><button className="icon-button" aria-label={`Acciones de ${user.name}`} onClick={() => setOpenActions(openActions === user.id ? null : user.id)}><MoreHorizontal size={18} /></button>{openActions === user.id && <div className="row-actions"><button onClick={() => makeDialog(user)}>Editar y permisos</button>{user.status === 'Invitado' || user.status === 'Pendiente' ? <><button onClick={() => resendInvitation(user)}>Reenviar invitación</button><button onClick={() => revokeInvitation(user)}>Revocar invitación</button></> : <button onClick={() => toggleUser(user)}>{user.status === 'Activo' ? 'Desactivar' : 'Activar'} usuario</button>}</div>}</td></tr>)}</tbody></table>{visible.length === 0 && <div className="table-empty">No encontramos usuarios con ese nombre.</div>}</div>
      <div className="users-table-footer"><TablePagination page={page} pageSize={pageSize} pageCount={pageCount} total={filteredUsers.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} /></div>
    </Card>

    {modal && <div className="modal-backdrop" role="presentation"><section className="user-modal" role="dialog" aria-modal="true" aria-labelledby="user-form-title"><div className="modal-heading"><span className="modal-icon"><UserPlus size={18} /></span><button className="icon-button" onClick={() => setModal(null)} aria-label="Cerrar"><X size={18} /></button></div>
      <h2 id="user-form-title">{modal.mode === 'create' ? modal.step === 'review' ? 'Revisar invitación' : 'Crear usuario' : 'Editar usuario'}</h2>
      {modal.mode === 'create' && modal.step === 'review' ? <><p>Se creará {modal.form.role} para {modal.form.email}. La cuenta quedará pendiente hasta aceptar la invitación.</p>{modal.form.role === 'Viewer' && <p>{assignmentPayload().length} permisos seleccionados.</p>}<div className="modal-actions"><button className="button-secondary" onClick={() => setModal((current) => ({ ...current, step: 'form' }))}>Volver</button><button className="button-primary" onClick={submitCreate}>Confirmar y enviar</button></div></> : <>
        <p>{modal.mode === 'create' ? 'Completa los datos y revisa la invitación antes de crear.' : 'Actualiza el perfil, rol y permisos del usuario.'}</p>
        <form className="user-form" onSubmit={(event) => { event.preventDefault(); if (modal.mode === 'create') { if (modal.form.role === 'Viewer' && assignmentPayload().length === 0) { setNotice({ text: 'Un Viewer requiere al menos un permiso.' }); return; } setModal((current) => ({ ...current, step: 'review' })); } else submitEdit(); }}>
          <label>Nombre completo<input value={modal.form.displayName} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, displayName: event.target.value } }))} required maxLength={200} /></label>
          <label>Correo electrónico<input type="email" value={modal.form.email} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, email: event.target.value } }))} required maxLength={320} /></label>
          <label>Rol<select value={modal.form.role} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, role: event.target.value } }))}><option value="Viewer">Viewer</option><option value="Administrador">Administrador</option></select></label>
          {modal.form.role === 'Viewer' && <div className="permission-business-list">{Object.entries(groupedOptions).map(([businessId, group]) => <fieldset key={businessId}><legend>{group.name}</legend>{group.platforms.map((item) => { const key = `${item.BusinessId}:${item.SocialPlatformId}`; return <label key={key}><input type="checkbox" checked={modal.selected.has(key)} onChange={() => toggleAssignment(item.BusinessId, item.SocialPlatformId)} />{item.PlatformName}</label>; })}</fieldset>)}{options.length === 0 && <p>No hay comercios/plataformas disponibles para asignar.</p>}</div>}
          <div className="form-note">{modal.mode === 'create' ? 'No se configura una contraseña. Se enviará un enlace de activación de un solo uso.' : 'El cambio de rol Viewer requiere permisos válidos.'}</div>
          <div className="modal-actions"><button type="button" className="button-secondary" onClick={() => setModal(null)}>Cancelar</button><button type="submit" className="button-primary">{modal.mode === 'create' ? 'Revisar' : 'Guardar cambios'}</button></div>
        </form>
      </>}
    </section></div>}
  </div>;
}
