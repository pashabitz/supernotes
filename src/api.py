def before_get(table_config, orm, params, access_token):
    if not params or "user" not in params or params["user"] != access_token["sub"]:
        return False
    return True


def after_get(table_config, orm, result_set):
    return True


def before_insert(table_config, orm, values, access_token):
    values["user"] = access_token["sub"]
    return True


def after_insert(table_config, orm, values):
    return True


def before_delete(table_config, orm, params, access_token):
    existing = orm["notes"].get_item(params)
    if not existing or existing["user"] != access_token["sub"]:
        return False
    return True


def after_delete(table_config, orm, params):
    return True


def before_update(table_config, orm, key, update_values, access_token):
    existing = orm["notes"].get_item(key)
    if not existing or existing["user"] != access_token["sub"]:
        return False
    update_values.pop("user", None)
    return True


def after_update(table_config, orm, key, update_values):
    return True



def custom_get(path, table_configs, orm, params):
    return True

def custom_post(path, table_configs, orm, params, values):
    return True

def custom_delete(path, table_configs, orm, params):
    return True

