ALTER TABLE consigna
    ADD COLUMN rubrica TEXT NULL;

CREATE TABLE correccion_codigo (
    id_correccion BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    entrega_codigo_id BIGINT UNSIGNED NOT NULL,
    estado ENUM('procesando', 'corregida', 'error') NOT NULL DEFAULT 'procesando',
    nota DECIMAL(4, 2) NULL,
    feedback_json JSON NULL,
    modelo VARCHAR(120) NOT NULL,
    error_message VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_correccion),
    UNIQUE KEY uq_correccion_codigo_entrega (entrega_codigo_id)
);