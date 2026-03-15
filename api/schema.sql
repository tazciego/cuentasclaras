-- ─── CuentasClaras — Esquema de base de datos ────────────────────────────────
-- Ejecutar en MySQL 8+ / MariaDB 10.5+
-- Crear la base de datos primero:
--   CREATE DATABASE cuentasclaras CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   USE cuentasclaras;

SET FOREIGN_KEY_CHECKS = 0;

-- ─── Eventos ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eventos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(120)  NOT NULL,
    tipo        ENUM('restaurante','reunion','viaje','roomies') NOT NULL DEFAULT 'restaurante',
    fecha       DATE,
    hora        TIME,
    lugar       VARCHAR(200),
    codigo      VARCHAR(10)   UNIQUE NOT NULL,
    estado      ENUM('activo','cerrado') NOT NULL DEFAULT 'activo',
    creado_en   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── Invitados ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitados (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    evento_id    INT          NOT NULL,
    nombre       VARCHAR(80)  NOT NULL,
    color_index  TINYINT      NOT NULL DEFAULT 0,
    es_anfitrion TINYINT(1)   NOT NULL DEFAULT 0,
    token        VARCHAR(64)  UNIQUE,
    unido_en     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Consumos ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consumos (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    evento_id    INT            NOT NULL,
    descripcion  VARCHAR(150)   NOT NULL,
    precio       DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    cantidad     INT            NOT NULL DEFAULT 1,
    creado_en    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Consumos ↔ Invitados (quién pidió qué) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS consumos_invitados (
    consumo_id   INT NOT NULL,
    invitado_id  INT NOT NULL,
    cantidad     INT NOT NULL DEFAULT 1,
    PRIMARY KEY (consumo_id, invitado_id),
    FOREIGN KEY (consumo_id)  REFERENCES consumos(id)  ON DELETE CASCADE,
    FOREIGN KEY (invitado_id) REFERENCES invitados(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Pagos ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pagos (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    evento_id      INT           NOT NULL,
    invitado_id    INT           NOT NULL,
    monto          DECIMAL(10,2) NOT NULL,
    metodo         ENUM('spei','tarjeta','efectivo','otro') NOT NULL DEFAULT 'otro',
    estado         ENUM('pendiente','confirmado','rechazado') NOT NULL DEFAULT 'pendiente',
    referencia     VARCHAR(100),
    nota           VARCHAR(255),
    creado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmado_en  DATETIME,
    FOREIGN KEY (evento_id)   REFERENCES eventos(id)   ON DELETE CASCADE,
    FOREIGN KEY (invitado_id) REFERENCES invitados(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
