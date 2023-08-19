from django.contrib import admin
import core.models as core_models

# Register your models here.

admin.site.register(core_models.CachedRelevantProduct)
admin.site.register(core_models.CachedAllProduct)
admin.site.register(core_models.CachedProductsPage)
