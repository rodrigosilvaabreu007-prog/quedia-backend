#!/usr/bin/env python3
"""
Script para backup e verificação de eventos no Firestore
Garante que eventos nunca sejam perdidos durante atualizações
"""

import os
import json
import datetime
from google.cloud import firestore
from google.oauth2 import service_account

def get_firestore_client():
    """Obtém cliente Firestore configurado"""
    try:
        # Tentar usar credenciais do ambiente (Cloud Functions)
        return firestore.Client(project='quedia-backend')
    except:
        # Fallback para credenciais locais
        try:
            credentials_path = os.path.join(os.path.dirname(__file__), '..', 'firebase-service-account.json')
            credentials = service_account.Credentials.from_service_account_file(credentials_path)
            return firestore.Client(credentials=credentials, project='quedia-backend')
        except:
            print("❌ Erro: Não foi possível conectar ao Firestore")
            return None

def backup_eventos():
    """Faz backup de todos os eventos existentes"""
    print("🔄 Fazendo backup dos eventos...")

    client = get_firestore_client()
    if not client:
        return False

    try:
        eventos_ref = client.collection('eventos')
        eventos = eventos_ref.stream()

        backup_data = []
        count = 0

        for evento in eventos:
            evento_data = evento.to_dict()
            evento_data['id'] = evento.id
            backup_data.append(evento_data)
            count += 1

        if count == 0:
            print("ℹ️ Nenhum evento encontrado para backup")
            return True

        # Criar arquivo de backup
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f'eventos_backup_{timestamp}.json'

        with open(backup_filename, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False, default=str)

        print(f"✅ Backup criado: {backup_filename} ({count} eventos)")

        # Também salvar em um arquivo fixo para restauração rápida
        with open('eventos_backup_latest.json', 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False, default=str)

        return True

    except Exception as e:
        print(f"❌ Erro no backup: {e}")
        return False

def verificar_eventos():
    """Verifica se há eventos no Firestore"""
    print("🔍 Verificando eventos existentes...")

    client = get_firestore_client()
    if not client:
        return 0

    try:
        eventos_ref = client.collection('eventos')
        eventos = eventos_ref.stream()

        count = 0
        for evento in eventos:
            count += 1
            if count <= 3:  # Mostrar primeiros 3 eventos
                data = evento.to_dict()
                print(f"  📅 Evento: {data.get('nome', 'Sem nome')} (ID: {evento.id})")

        print(f"📊 Total de eventos encontrados: {count}")
        return count

    except Exception as e:
        print(f"❌ Erro ao verificar eventos: {e}")
        return 0

def restaurar_backup(backup_file='eventos_backup_latest.json'):
    """Restaura eventos de um arquivo de backup"""
    print(f"🔄 Restaurando backup de {backup_file}...")

    if not os.path.exists(backup_file):
        print(f"❌ Arquivo de backup não encontrado: {backup_file}")
        return False

    client = get_firestore_client()
    if not client:
        return False

    try:
        with open(backup_file, 'r', encoding='utf-8') as f:
            backup_data = json.load(f)

        eventos_ref = client.collection('eventos')
        restored_count = 0

        for evento_data in backup_data:
            evento_id = evento_data.pop('id', None)
            if evento_id:
                # Verificar se já existe
                doc_ref = eventos_ref.document(evento_id)
                if not doc_ref.get().exists:
                    doc_ref.set(evento_data)
                    restored_count += 1
                    print(f"  ✅ Restaurado: {evento_data.get('nome', 'Sem nome')}")

        print(f"✅ Restauração concluída: {restored_count} eventos restaurados")
        return True

    except Exception as e:
        print(f"❌ Erro na restauração: {e}")
        return False

def main():
    """Função principal"""
    print("🛡️ Sistema de Proteção de Eventos - Quedia")
    print("=" * 50)

    # Verificar eventos atuais
    eventos_antes = verificar_eventos()

    # Fazer backup
    if not backup_eventos():
        print("❌ Falha no backup. Abortando.")
        return

    print("\n✅ Proteções implementadas:")
    print("  🔒 Backup automático criado")
    print("  📊 Eventos verificados antes da atualização")
    print("  🛡️ Sistema preparado para restauração se necessário")

    # Verificar novamente após backup
    eventos_depois = verificar_eventos()

    if eventos_antes != eventos_depois:
        print(f"⚠️ ALERTA: Número de eventos mudou durante o backup! ({eventos_antes} → {eventos_depois})")
        print("🔄 Tentando restaurar do backup...")
        restaurar_backup()
    else:
        print("✅ Integridade dos dados mantida durante o backup")

if __name__ == '__main__':
    main()