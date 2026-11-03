ALTER TABLE login
    ADD COLUMN estado ENUM('activo', 'suspendido', 'eliminado')
        NOT NULL DEFAULT 'activo' AFTER rol;

CREATE TABLE solicitud_alta_alumno (
    id_solicitud BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    alumno_cedula_alumno INT NOT NULL,
    usuario VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NULL,
    token_consulta_hash CHAR(64) NOT NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada')
        NOT NULL DEFAULT 'pendiente',
    motivo_rechazo TEXT NULL,
    resuelta_por_login_id INT NULL,
    resuelta_por_usuario VARCHAR(50) NULL,
    resuelta_por_rol ENUM('admin', 'profesor') NULL,
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMP NULL,
    alumno_pendiente INT GENERATED ALWAYS AS (
        CASE WHEN estado = 'pendiente' THEN alumno_cedula_alumno ELSE NULL END
    ) STORED,
    usuario_pendiente VARCHAR(50) GENERATED ALWAYS AS (
        CASE WHEN estado = 'pendiente' THEN usuario ELSE NULL END
    ) STORED,
    PRIMARY KEY (id_solicitud),
    UNIQUE KEY uq_solicitud_alta_token (token_consulta_hash),
    UNIQUE KEY uq_solicitud_alta_alumno_pendiente (alumno_pendiente),
    UNIQUE KEY uq_solicitud_alta_usuario_pendiente (usuario_pendiente),
    KEY ix_solicitud_alta_estado_fecha (estado, fecha_solicitud),
    CONSTRAINT fk_solicitud_alta_alumno
        FOREIGN KEY (alumno_cedula_alumno)
        REFERENCES alumno (cedula_alumno),
    CONSTRAINT fk_solicitud_alta_revisor
        FOREIGN KEY (resuelta_por_login_id)
        REFERENCES login (id_login)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE solicitud_gestion_cuenta (
    id_solicitud BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cuenta_objetivo_id INT NOT NULL,
    cuenta_solicitante_id INT NOT NULL,
    solicitante_usuario VARCHAR(50) NOT NULL,
    solicitante_rol ENUM('alumno', 'profesor') NOT NULL,
    accion ENUM('suspender', 'eliminar') NOT NULL,
    motivo TEXT NOT NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada')
        NOT NULL DEFAULT 'pendiente',
    motivo_resolucion TEXT NULL,
    resuelta_por_login_id INT NULL,
    resuelta_por_usuario VARCHAR(50) NULL,
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMP NULL,
    objetivo_pendiente INT GENERATED ALWAYS AS (
        CASE WHEN estado = 'pendiente' THEN cuenta_objetivo_id ELSE NULL END
    ) STORED,
    PRIMARY KEY (id_solicitud),
    UNIQUE KEY uq_solicitud_gestion_objetivo_pendiente (objetivo_pendiente),
    KEY ix_solicitud_gestion_estado_fecha (estado, fecha_solicitud),
    CONSTRAINT fk_solicitud_gestion_objetivo
        FOREIGN KEY (cuenta_objetivo_id)
        REFERENCES login (id_login),
    CONSTRAINT fk_solicitud_gestion_solicitante
        FOREIGN KEY (cuenta_solicitante_id)
        REFERENCES login (id_login),
    CONSTRAINT fk_solicitud_gestion_revisor
        FOREIGN KEY (resuelta_por_login_id)
        REFERENCES login (id_login)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE auditoria_cuenta (
    id_evento BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tipo_solicitud ENUM('alta_alumno', 'gestion_cuenta', 'administracion') NOT NULL,
    solicitud_id BIGINT UNSIGNED NULL,
    accion VARCHAR(40) NOT NULL,
    cuenta_objetivo_id INT NULL,
    alumno_cedula INT NULL,
    actor_login_id INT NULL,
    actor_usuario VARCHAR(50) NOT NULL,
    actor_rol VARCHAR(20) NOT NULL,
    motivo TEXT NULL,
    fecha_evento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_evento),
    KEY ix_auditoria_cuenta_solicitud (tipo_solicitud, solicitud_id, fecha_evento),
    KEY ix_auditoria_cuenta_objetivo (cuenta_objetivo_id, fecha_evento),
    KEY ix_auditoria_cuenta_actor (actor_login_id, fecha_evento)
) ENGINE=InnoDB;
