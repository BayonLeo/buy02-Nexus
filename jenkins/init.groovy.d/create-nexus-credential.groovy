import jenkins.model.*
import com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl
import com.cloudbees.plugins.credentials.CredentialsScope
import com.cloudbees.plugins.credentials.domains.Domain
import com.cloudbees.plugins.credentials.SystemCredentialsProvider
import com.cloudbees.plugins.credentials.CredentialsProvider
import com.cloudbees.plugins.credentials.common.StandardCredentials

// Create global Jenkins credential 'nexus-admin' (username: admin / password: adminadmin)
def instance = Jenkins.get()

def existing = CredentialsProvider.lookupCredentials(StandardCredentials.class, instance, null, null)
                    .find { it.id == 'nexus-admin' }

if (existing) {
    println('Credential nexus-admin already exists, skipping creation.')
} else {
    def c = new UsernamePasswordCredentialsImpl(CredentialsScope.GLOBAL,
        'nexus-admin',
        'Nexus admin (created by init script)',
        'admin',
        'adminadmin')

    SystemCredentialsProvider.getInstance().getStore().addCredentials(Domain.global(), c)
    println('Created credential nexus-admin')
}
